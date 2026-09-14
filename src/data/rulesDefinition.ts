import { ComplianceRule } from '../types';

export const LEGAL_METROLOGY_RULES: ComplianceRule[] = [
  {
    code: 'LM-001',
    title: 'Manufacturer / Packer / Importer Identity',
    citation: 'Rule 6(1)(a)',
    description: 'Name and complete address of the manufacturer, or where manufacturer is not packer, name and address of manufacturer and packer. In case of imported packages, name and complete address of the importer.',
    mandatory: true,
    notes: 'Address must contain sufficient geographical details (city, state, pin code) for postal contact.'
  },
  {
    code: 'LM-002',
    title: 'Common or Generic Name',
    citation: 'Rule 6(1)(b)',
    description: 'Common or generic names of the commodity contained in the package, or in case of packages with more than one product, the name and number of each.',
    mandatory: true,
    notes: 'Generic description must be explicit, not merely an arbitrary brand or trademark.'
  },
  {
    code: 'LM-003',
    title: 'Net Quantity Declaration',
    citation: 'Rule 6(1)(c) & Second Schedule',
    description: 'Net quantity in terms of standard unit of weight or measure, or number if commodity is sold by number. Must use standard SI units (g, kg, mL, L, m).',
    mandatory: true,
    notes: 'Non-standard abbreviations such as "gm", "gms", "kilos", or "litres" violate Second Schedule specifications.'
  },
  {
    code: 'LM-004',
    title: 'Month & Year of Manufacture / Packing',
    citation: 'Rule 6(1)(d)',
    description: 'Month and year in which the commodity is manufactured or pre-packed or imported. Formats accepted: MM/YYYY or standard month name and year.',
    mandatory: true,
    notes: 'Must be legible and clearly distinguished from best-before dates.'
  },
  {
    code: 'LM-005',
    title: 'Maximum Retail Price (MRP)',
    citation: 'Rule 6(1)(e)',
    description: 'Retail sale price of the package shall be clearly indicated in the format: MRP ₹ xx.xx (inclusive of all taxes) or MRP Rs. xx.xx (incl. of all taxes).',
    mandatory: true,
    notes: 'Must include currency symbol and the mandatory phrase "inclusive of all taxes" or "incl. of all taxes".'
  },
  {
    code: 'LM-006',
    title: 'Consumer Care Contact Details',
    citation: 'Rule 6(1)(f)',
    description: 'Name, address, telephone number, and e-mail address of the person or office who can be contacted in case of consumer complaints.',
    mandatory: true,
    notes: 'Must specify designation/name, postal address, phone/helpline number, and valid email address.'
  },
  {
    code: 'LM-007',
    title: 'Country of Origin',
    citation: 'Rule 6(1)(n)',
    description: 'Name of the country of origin or manufacture or assembly on the package.',
    mandatory: true,
    notes: 'Mandatory on both domestic and imported packages pursuant to 2017 amendments.'
  },
  {
    code: 'LM-008',
    title: 'Unit Sale Price (USP)',
    citation: 'Rule 6(10) (2021 Amendment)',
    description: 'Unit sale price in rupees and paise per gram, kilogram, milliliter, liter, or piece where total quantity exceeds threshold or sold by measure.',
    mandatory: true,
    notes: 'Applicable to pre-packaged commodities sold by weight/measure/count (e.g. ₹ 0.40 / g or ₹ 40 / 100 g).'
  }
];
