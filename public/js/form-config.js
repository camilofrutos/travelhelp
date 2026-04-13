/**
 * form-config.js — Centralized form field configuration
 *
 * Each step has:
 *   - titleKey / subtitleKey: i18n keys for step header
 *   - fields: array of field definitions
 *
 * Each field has:
 *   - id: unique field name (used as payload key)
 *   - labelKey: i18n key for the label
 *   - type: text | email | tel | textarea | select | radio | checkbox | date | number
 *   - required: boolean
 *   - placeholderKey: i18n key for placeholder (optional)
 *   - helpKey: i18n key for help text (optional)
 *   - options: array of { value, labelKey } for select/radio (optional)
 */

const FORM_STEPS = [
  // Step 1: Owner / Personal Info
  {
    titleKey: 'stepOwner',
    subtitleKey: 'stepOwnerSub',
    fields: [
      { id: 'firstName', labelKey: 'firstName', type: 'text', required: true, placeholderKey: 'phFirstName' },
      { id: 'middleName', labelKey: 'middleName', type: 'text', required: false, placeholderKey: 'phMiddleName' },
      { id: 'lastName', labelKey: 'lastName', type: 'text', required: true, placeholderKey: 'phLastName' },
      { id: 'secondLastName', labelKey: 'secondLastName', type: 'text', required: false, placeholderKey: 'phSecondLastName' },
      { id: 'birthDate', labelKey: 'birthDate', type: 'date', required: true },
      { id: 'birthCountry', labelKey: 'birthCountry', type: 'text', required: true, placeholderKey: 'phCountry' },
      { id: 'taxId', labelKey: 'taxId', type: 'text', required: true, placeholderKey: 'phTaxId', helpKey: 'helpTaxId' },
    ]
  },

  // Step 2: Physical Address
  {
    titleKey: 'stepAddress',
    subtitleKey: 'stepAddressSub',
    fields: [
      { id: 'residenceCountry', labelKey: 'residenceCountry', type: 'text', required: true, placeholderKey: 'phCountry' },
      { id: 'residenceAddress', labelKey: 'residenceAddress', type: 'text', required: true, placeholderKey: 'phAddress' },
      { id: 'city', labelKey: 'city', type: 'text', required: true, placeholderKey: 'phCity' },
    ]
  },

  // Step 3: Contact Information
  {
    titleKey: 'stepContact',
    subtitleKey: 'stepContactSub',
    fields: [
      { id: 'contactEmail', labelKey: 'contactEmail', type: 'email', required: true, placeholderKey: 'phEmail' },
      { id: 'mobilePhone', labelKey: 'mobilePhone', type: 'tel', required: true, placeholderKey: 'phPhone' },
    ]
  },

  // Step 4: Employment Information
  {
    titleKey: 'stepEmployment',
    subtitleKey: 'stepEmploymentSub',
    fields: [
      {
        id: 'employmentStatus', labelKey: 'employmentStatus', type: 'select', required: true,
        options: [
          { value: '', labelKey: 'optSelect' },
          { value: 'employed', labelKey: 'optEmployed' },
          { value: 'self_employed', labelKey: 'optSelfEmployed' },
          { value: 'retired', labelKey: 'optRetired' },
          { value: 'unemployed', labelKey: 'optUnemployed' },
          { value: 'student', labelKey: 'optStudent' },
          { value: 'other', labelKey: 'optOther' },
        ]
      },
      { id: 'occupation', labelKey: 'occupation', type: 'text', required: true, placeholderKey: 'phOccupation' },
      { id: 'position', labelKey: 'position', type: 'text', required: false, placeholderKey: 'phPosition' },
      { id: 'businessNature', labelKey: 'businessNature', type: 'text', required: false, placeholderKey: 'phBusinessNature' },
    ]
  },

  // Step 5: Employer Details
  {
    titleKey: 'stepEmployer',
    subtitleKey: 'stepEmployerSub',
    fields: [
      { id: 'employerName', labelKey: 'employerName', type: 'text', required: false, placeholderKey: 'phEmployerName' },
      { id: 'employerAddress', labelKey: 'employerAddress', type: 'text', required: false, placeholderKey: 'phAddress' },
      { id: 'employerCity', labelKey: 'employerCity', type: 'text', required: false, placeholderKey: 'phCity' },
      { id: 'currentEmployerYears', labelKey: 'currentEmployerYears', type: 'number', required: false, placeholderKey: 'phYears' },
    ]
  },

  // Step 6: Demographics
  {
    titleKey: 'stepDemographics',
    subtitleKey: 'stepDemographicsSub',
    fields: [
      {
        id: 'maritalStatus', labelKey: 'maritalStatus', type: 'select', required: true,
        options: [
          { value: '', labelKey: 'optSelect' },
          { value: 'single', labelKey: 'optSingle' },
          { value: 'married', labelKey: 'optMarried' },
          { value: 'divorced', labelKey: 'optDivorced' },
          { value: 'widowed', labelKey: 'optWidowed' },
        ]
      },
      { id: 'dependents', labelKey: 'dependents', type: 'number', required: true, placeholderKey: 'phYears' },
      { id: 'dependentAges', labelKey: 'dependentAges', type: 'text', required: false, placeholderKey: 'phDependentAges' },
    ]
  },

  // Step 7: Financial Profile
  {
    titleKey: 'stepFinancial',
    subtitleKey: 'stepFinancialSub',
    fields: [
      { id: 'annualIncome', labelKey: 'annualIncome', type: 'number', required: true, placeholderKey: 'phAmount' },
      { id: 'netWorth', labelKey: 'netWorth', type: 'number', required: true, placeholderKey: 'phAmount' },
      { id: 'liquidNetWorth', labelKey: 'liquidNetWorth', type: 'number', required: true, placeholderKey: 'phAmount', helpKey: 'helpLiquidNetWorth' },
      {
        id: 'liquidityNeeds', labelKey: 'liquidityNeeds', type: 'select', required: true,
        options: [
          { value: '', labelKey: 'optSelect' },
          { value: 'low', labelKey: 'optLow' },
          { value: 'medium', labelKey: 'optMedium' },
          { value: 'high', labelKey: 'optHigh' },
        ]
      },
      {
        id: 'investmentTimeHorizon', labelKey: 'investmentTimeHorizon', type: 'select', required: true,
        options: [
          { value: '', labelKey: 'optSelect' },
          { value: 'short', labelKey: 'optShortTerm' },
          { value: 'medium', labelKey: 'optMediumTerm' },
          { value: 'long', labelKey: 'optLongTerm' },
        ]
      },
    ]
  },

  // Step 8: Investment Experience
  {
    titleKey: 'stepInvestment',
    subtitleKey: 'stepInvestmentSub',
    fields: [
      {
        id: 'stocksBonds', labelKey: 'stocksBonds', type: 'select', required: true, helpKey: 'helpInvestmentExp',
        options: [
          { value: '', labelKey: 'optSelect' },
          { value: 'none', labelKey: 'optNone' },
          { value: 'limited', labelKey: 'optLimited' },
          { value: 'moderate', labelKey: 'optModerate' },
          { value: 'extensive', labelKey: 'optExtensive' },
        ]
      },
      {
        id: 'optionsExperience', labelKey: 'optionsExperience', type: 'select', required: true,
        options: [
          { value: '', labelKey: 'optSelect' },
          { value: 'none', labelKey: 'optNone' },
          { value: 'limited', labelKey: 'optLimited' },
          { value: 'moderate', labelKey: 'optModerate' },
          { value: 'extensive', labelKey: 'optExtensive' },
        ]
      },
      {
        id: 'mutualFunds', labelKey: 'mutualFunds', type: 'select', required: true,
        options: [
          { value: '', labelKey: 'optSelect' },
          { value: 'none', labelKey: 'optNone' },
          { value: 'limited', labelKey: 'optLimited' },
          { value: 'moderate', labelKey: 'optModerate' },
          { value: 'extensive', labelKey: 'optExtensive' },
        ]
      },
      {
        id: 'variableAnnuities', labelKey: 'variableAnnuities', type: 'select', required: true,
        options: [
          { value: '', labelKey: 'optSelect' },
          { value: 'none', labelKey: 'optNone' },
          { value: 'limited', labelKey: 'optLimited' },
          { value: 'moderate', labelKey: 'optModerate' },
          { value: 'extensive', labelKey: 'optExtensive' },
        ]
      },
      {
        id: 'alternativeInvestments', labelKey: 'alternativeInvestments', type: 'select', required: true,
        options: [
          { value: '', labelKey: 'optSelect' },
          { value: 'none', labelKey: 'optNone' },
          { value: 'limited', labelKey: 'optLimited' },
          { value: 'moderate', labelKey: 'optModerate' },
          { value: 'extensive', labelKey: 'optExtensive' },
        ]
      },
      { id: 'investmentExperienceNote', labelKey: 'investmentExperienceNote', type: 'textarea', required: false, placeholderKey: 'phDetail' },
    ]
  },

  // Step 9: Customer Information
  {
    titleKey: 'stepCustomerInfo',
    subtitleKey: 'stepCustomerInfoSub',
    fields: [
      { id: 'sourceOfFunds', labelKey: 'sourceOfFunds', type: 'text', required: true, placeholderKey: 'phDetail' },
      { id: 'advisorKnownClientTime', labelKey: 'advisorKnownClientTime', type: 'text', required: false, placeholderKey: 'phYears' },
      { id: 'lastMeetingDate', labelKey: 'lastMeetingDate', type: 'date', required: false },
      { id: 'lastMeetingPlace', labelKey: 'lastMeetingPlace', type: 'text', required: false, placeholderKey: 'phCity' },
    ]
  },

  // Step 10: Government Identification
  {
    titleKey: 'stepGovernmentId',
    subtitleKey: 'stepGovernmentIdSub',
    fields: [
      {
        id: 'documentType', labelKey: 'documentType', type: 'select', required: true,
        options: [
          { value: '', labelKey: 'optSelect' },
          { value: 'passport', labelKey: 'optPassport' },
          { value: 'national_id', labelKey: 'optNationalId' },
          { value: 'driver_license', labelKey: 'optDriverLicense' },
        ]
      },
      { id: 'documentNumber', labelKey: 'documentNumber', type: 'text', required: true, placeholderKey: 'phDocNumber' },
      { id: 'issueCountry', labelKey: 'issueCountry', type: 'text', required: true, placeholderKey: 'phCountry' },
      { id: 'issueDate', labelKey: 'issueDate', type: 'date', required: true },
      { id: 'expirationDate', labelKey: 'expirationDate', type: 'date', required: true },
    ]
  },

  // Step 11: Affiliations
  {
    titleKey: 'stepAffiliations',
    subtitleKey: 'stepAffiliationsSub',
    fields: [
      {
        id: 'hasOtherBrokerAccounts', labelKey: 'hasOtherBrokerAccounts', type: 'radio', required: true,
        options: [
          { value: 'yes', labelKey: 'optYes' },
          { value: 'no', labelKey: 'optNo' },
        ]
      },
      {
        id: 'isInstitutionalInvestor', labelKey: 'isInstitutionalInvestor', type: 'radio', required: true,
        options: [
          { value: 'yes', labelKey: 'optYes' },
          { value: 'no', labelKey: 'optNo' },
        ]
      },
      {
        id: 'relatedToExchangeOrFINRA', labelKey: 'relatedToExchangeOrFINRA', type: 'radio', required: true,
        options: [
          { value: 'yes', labelKey: 'optYes' },
          { value: 'no', labelKey: 'optNo' },
        ]
      },
      {
        id: 'affiliateOfPublicCompany', labelKey: 'affiliateOfPublicCompany', type: 'radio', required: true,
        options: [
          { value: 'yes', labelKey: 'optYes' },
          { value: 'no', labelKey: 'optNo' },
        ]
      },
      {
        id: 'relatedToStoneX', labelKey: 'relatedToStoneX', type: 'radio', required: true,
        options: [
          { value: 'yes', labelKey: 'optYes' },
          { value: 'no', labelKey: 'optNo' },
        ]
      },
      { id: 'affiliationsDetails', labelKey: 'affiliationsDetails', type: 'textarea', required: false, placeholderKey: 'phDetail' },
    ]
  },

  // Step 12: Section 312 — Non-US Account Info
  {
    titleKey: 'stepSection312',
    subtitleKey: 'stepSection312Sub',
    fields: [
      { id: 'previousStoneXAccounts', labelKey: 'previousStoneXAccounts', type: 'text', required: false, placeholderKey: 'phAccountNumbers', helpKey: 'helpSection312' },
      {
        id: 'willDepositAssets', labelKey: 'willDepositAssets', type: 'radio', required: true,
        options: [
          { value: 'yes', labelKey: 'optYes' },
          { value: 'no', labelKey: 'optNo' },
        ]
      },
      { id: 'depositedAssetTypes', labelKey: 'depositedAssetTypes', type: 'textarea', required: false, placeholderKey: 'phDetail' },
      { id: 'initialDepositAmount', labelKey: 'initialDepositAmount', type: 'number', required: false, placeholderKey: 'phAmount' },
      { id: 'initialDepositInstitution', labelKey: 'initialDepositInstitution', type: 'text', required: false, placeholderKey: 'phInstitution' },
      {
        id: 'thirdPartyOwner', labelKey: 'thirdPartyOwner', type: 'radio', required: true,
        options: [
          { value: 'yes', labelKey: 'optYes' },
          { value: 'no', labelKey: 'optNo' },
        ]
      },
      {
        id: 'thirdPartyTransfers', labelKey: 'thirdPartyTransfers', type: 'radio', required: true,
        options: [
          { value: 'yes', labelKey: 'optYes' },
          { value: 'no', labelKey: 'optNo' },
        ]
      },
    ]
  },

  // Step 13: Source of Funds
  {
    titleKey: 'stepSourceFunds',
    subtitleKey: 'stepSourceFundsSub',
    fields: [
      { id: 'sourceCompensation', labelKey: 'sourceCompensation', type: 'text', required: false, placeholderKey: 'phDetail' },
      { id: 'sourceBusinessOwner', labelKey: 'sourceBusinessOwner', type: 'text', required: false, placeholderKey: 'phDetail' },
      { id: 'sourceWealth', labelKey: 'sourceWealth', type: 'text', required: false, placeholderKey: 'phDetail' },
      { id: 'sourceCorporatePnL', labelKey: 'sourceCorporatePnL', type: 'text', required: false, placeholderKey: 'phDetail' },
    ]
  },

  // Step 14: Final Consent
  {
    titleKey: 'stepConsent',
    subtitleKey: 'stepConsentSub',
    fields: [
      { id: 'acceptTerms', labelKey: 'acceptTerms', type: 'checkbox', required: true },
    ]
  },
];
