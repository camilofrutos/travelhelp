#!/usr/bin/env python3
"""
Extrae datos de pólizas BUPA desde screenshots de tablas y genera un Excel consolidado.

Uso:
    export ANTHROPIC_API_KEY=sk-ant-...
    python extract_bupa.py
"""

import base64
import json
import os
import re
import sys
import time
from datetime import datetime
from pathlib import Path

import anthropic
from dotenv import load_dotenv
from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill, numbers
from openpyxl.utils import get_column_letter

load_dotenv()

# ---------------------------------------------------------------------------
# Configuración
# ---------------------------------------------------------------------------
MODEL = "claude-sonnet-4-20250514"
PROMPT = (
    "Extrae todos los datos de esta tabla de pólizas BUPA. "
    "Devuelve SOLO un JSON array donde cada elemento tiene estas claves: "
    "poliza, titular, plan, pais, prima_moneda, prima_monto, pago, renovacion, estado. "
    "Para prima, separa la moneda (USD) del monto numérico. "
    "El monto numérico debe ser un float (usa punto como separador decimal, sin separador de miles). "
    "No incluyas texto extra, solo el JSON."
)
DELAY_BETWEEN_CALLS = 0.5  # segundos
OUTPUT_FILE = "BUPA_polizas_extraidas.xlsx"
ERROR_LOG = "errores_parseo.txt"


def find_images() -> list[Path]:
    """Busca imágenes PNG en ./screenshots/ o en el directorio actual."""
    base = Path(".")
    screenshots_dir = base / "screenshots"
    search_dir = screenshots_dir if screenshots_dir.is_dir() else base
    images = sorted(search_dir.glob("*.png"))
    if not images:
        # Intentar también jpg/jpeg
        images = sorted(
            list(search_dir.glob("*.jpg")) + list(search_dir.glob("*.jpeg"))
        )
    return images


def image_to_base64(path: Path) -> tuple[str, str]:
    """Lee una imagen y devuelve (base64_data, media_type)."""
    suffix = path.suffix.lower()
    media_map = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg"}
    media_type = media_map.get(suffix, "image/png")
    with open(path, "rb") as f:
        data = base64.standard_b64encode(f.read()).decode("utf-8")
    return data, media_type


def extract_from_image(client: anthropic.Anthropic, image_path: Path) -> list[dict]:
    """Envía una imagen a Claude y devuelve la lista de registros extraídos."""
    b64_data, media_type = image_to_base64(image_path)

    response = client.messages.create(
        model=MODEL,
        max_tokens=4096,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": b64_data,
                        },
                    },
                    {"type": "text", "text": PROMPT},
                ],
            }
        ],
    )

    raw_text = response.content[0].text.strip()

    # Intentar extraer JSON del texto (puede venir envuelto en ```json ... ```)
    json_match = re.search(r"\[.*\]", raw_text, re.DOTALL)
    if json_match:
        records = json.loads(json_match.group())
    else:
        records = json.loads(raw_text)

    return records


def parse_prima(value) -> float | None:
    """Convierte un valor de prima a float."""
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    s = str(value).strip()
    # Remover moneda si quedó pegada
    s = re.sub(r"[A-Za-z$]+", "", s).strip()
    # Manejar formato europeo: 19.295,45 → 19295.45
    if "," in s and "." in s:
        s = s.replace(".", "").replace(",", ".")
    elif "," in s:
        s = s.replace(",", ".")
    return float(s) if s else None


def parse_date(value) -> datetime | None:
    """Parsea fecha DD-MM-YYYY a datetime."""
    if not value:
        return None
    s = str(value).strip()
    for fmt in ("%d-%m-%Y", "%d/%m/%Y", "%Y-%m-%d", "%d-%m-%y", "%d/%m/%y"):
        try:
            return datetime.strptime(s, fmt)
        except ValueError:
            continue
    return None


def create_excel(records: list[dict], output_path: str):
    """Genera el archivo Excel con formato."""
    wb = Workbook()
    ws = wb.active
    ws.title = "Pólizas"

    # --- Headers ---
    headers = [
        "Póliza",
        "Titular/Guardián",
        "Plan",
        "País",
        "Moneda",
        "Prima",
        "Pago",
        "Renovación",
        "Estado",
        "Fuente",
    ]
    header_font = Font(bold=True, color="FFFFFF", size=11)
    header_fill = PatternFill(start_color="1B6CB0", end_color="1B6CB0", fill_type="solid")

    for col_idx, header in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col_idx, value=header)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal="center", vertical="center")

    # --- Fills condicionales para Estado ---
    estado_fills = {
        "activa": PatternFill(start_color="C6EFCE", end_color="C6EFCE", fill_type="solid"),
        "cancelada": PatternFill(start_color="FFC7CE", end_color="FFC7CE", fill_type="solid"),
        "lapsada": PatternFill(start_color="FFEB9C", end_color="FFEB9C", fill_type="solid"),
        "período de gracia": PatternFill(start_color="FFEB9C", end_color="FFEB9C", fill_type="solid"),
        "periodo de gracia": PatternFill(start_color="FFEB9C", end_color="FFEB9C", fill_type="solid"),
    }

    # --- Datos ---
    for row_idx, rec in enumerate(records, 2):
        ws.cell(row=row_idx, column=1, value=rec.get("poliza", ""))
        ws.cell(row=row_idx, column=2, value=rec.get("titular", ""))
        ws.cell(row=row_idx, column=3, value=rec.get("plan", ""))
        ws.cell(row=row_idx, column=4, value=rec.get("pais", ""))
        ws.cell(row=row_idx, column=5, value=rec.get("prima_moneda", "USD"))

        prima = parse_prima(rec.get("prima_monto"))
        prima_cell = ws.cell(row=row_idx, column=6, value=prima)
        if prima is not None:
            prima_cell.number_format = '#,##0.00'

        ws.cell(row=row_idx, column=7, value=rec.get("pago", ""))

        fecha = parse_date(rec.get("renovacion"))
        fecha_cell = ws.cell(row=row_idx, column=8, value=fecha)
        if fecha is not None:
            fecha_cell.number_format = "DD-MM-YYYY"

        estado = rec.get("estado", "")
        estado_cell = ws.cell(row=row_idx, column=9, value=estado)
        fill = estado_fills.get(str(estado).lower().strip())
        if fill:
            estado_cell.fill = fill

        ws.cell(row=row_idx, column=10, value=rec.get("fuente", ""))

    # --- Fila TOTAL ---
    total_row = len(records) + 2
    total_cell = ws.cell(row=total_row, column=1, value="TOTAL")
    total_cell.font = Font(bold=True)
    count_cell = ws.cell(row=total_row, column=2, value=f"{len(records)} registros")
    count_cell.font = Font(bold=True)

    # --- Auto-ajuste ancho de columnas ---
    for col_idx in range(1, len(headers) + 1):
        max_len = len(str(headers[col_idx - 1]))
        for row in ws.iter_rows(min_row=2, max_row=total_row, min_col=col_idx, max_col=col_idx):
            for cell in row:
                if cell.value:
                    max_len = max(max_len, len(str(cell.value)))
        ws.column_dimensions[get_column_letter(col_idx)].width = min(max_len + 3, 50)

    wb.save(output_path)


def validate_records(records: list[dict]):
    """Valida y muestra preview de los registros extraídos."""
    empty_poliza = [r for r in records if not r.get("poliza")]
    non_numeric_prima = []
    for r in records:
        try:
            val = parse_prima(r.get("prima_monto"))
            if val is None:
                non_numeric_prima.append(r)
        except (ValueError, TypeError):
            non_numeric_prima.append(r)

    print("\n" + "=" * 60)
    print("VALIDACIÓN")
    print("=" * 60)
    if empty_poliza:
        print(f"  ⚠ {len(empty_poliza)} registros con Póliza vacía")
    else:
        print("  ✓ Todos los registros tienen Póliza")

    if non_numeric_prima:
        print(f"  ⚠ {len(non_numeric_prima)} registros con Prima no numérica")
    else:
        print("  ✓ Todas las primas son numéricas")

    print("\nPREVIEW (primeros 5 registros):")
    print("-" * 60)
    for i, rec in enumerate(records[:5], 1):
        print(
            f"  {i}. {rec.get('poliza', 'N/A')} | "
            f"{rec.get('titular', 'N/A')} | "
            f"{rec.get('prima_moneda', '')} {rec.get('prima_monto', 'N/A')} | "
            f"{rec.get('estado', 'N/A')}"
        )
    print()


def main():
    # Verificar API key
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("ERROR: Variable de entorno ANTHROPIC_API_KEY no configurada.")
        print("Configúrala con: export ANTHROPIC_API_KEY=sk-ant-...")
        sys.exit(1)

    client = anthropic.Anthropic(api_key=api_key)

    # Buscar imágenes
    images = find_images()
    if not images:
        print("ERROR: No se encontraron imágenes PNG/JPG en ./screenshots/ ni en el directorio actual.")
        sys.exit(1)

    total_images = len(images)
    print(f"Encontradas {total_images} imágenes para procesar.\n")

    all_records = []
    errors = []
    error_log_entries = []

    for idx, img_path in enumerate(images, 1):
        print(f"[imagen {idx}/{total_images}] procesando {img_path.name}", end=" → ", flush=True)
        try:
            records = extract_from_image(client, img_path)
            # Agregar fuente a cada registro
            for rec in records:
                rec["fuente"] = img_path.name
            all_records.extend(records)
            print(f"{len(records)} registros extraídos")
        except json.JSONDecodeError as e:
            print(f"ERROR parseo JSON: {e}")
            errors.append(img_path.name)
            # Guardar respuesta raw para revisión
            try:
                b64_data, media_type = image_to_base64(img_path)
                response = client.messages.create(
                    model=MODEL,
                    max_tokens=4096,
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "image",
                                    "source": {
                                        "type": "base64",
                                        "media_type": media_type,
                                        "data": b64_data,
                                    },
                                },
                                {"type": "text", "text": PROMPT},
                            ],
                        }
                    ],
                )
                raw = response.content[0].text
            except Exception:
                raw = "(no se pudo obtener respuesta raw)"
            error_log_entries.append(f"--- {img_path.name} ---\n{raw}\n\n")
        except Exception as e:
            print(f"ERROR: {e}")
            errors.append(img_path.name)
            error_log_entries.append(f"--- {img_path.name} ---\nException: {e}\n\n")

        # Delay entre llamadas
        if idx < total_images:
            time.sleep(DELAY_BETWEEN_CALLS)

    # Guardar log de errores de parseo
    if error_log_entries:
        with open(ERROR_LOG, "w", encoding="utf-8") as f:
            f.writelines(error_log_entries)
        print(f"\nErrores de parseo guardados en {ERROR_LOG}")

    # Generar Excel
    if all_records:
        create_excel(all_records, OUTPUT_FILE)

    # Resumen final
    print("\n" + "=" * 60)
    print("RESUMEN")
    print("=" * 60)
    print(f"  Total imágenes procesadas: {total_images - len(errors)}")
    print(f"  Total registros extraídos: {len(all_records)}")
    print(f"  Errores: {len(errors)}", end="")
    if errors:
        print(f" ({', '.join(errors)})")
    else:
        print()
    if all_records:
        print(f"  Archivo generado: {OUTPUT_FILE}")
    else:
        print("  ⚠ No se generó Excel (0 registros extraídos)")

    # Validación
    if all_records:
        validate_records(all_records)


if __name__ == "__main__":
    main()
