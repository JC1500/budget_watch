export type BudgetEntry = {
  id: string;
  ministry: string;
  department: string;
  amountCrore: number;
};

const sourceRows: [ministry: string, department: string, amountCrore: number][] = [
  ["Ministry of Agriculture and Farmers Welfare", "Department of Agriculture and Farmers Welfare", 122528.77],
  ["Ministry of Agriculture and Farmers Welfare", "Department of Agricultural Research and Education", 9941.09],
  ["Ministry of Agriculture and Farmers Welfare", "Atomic Energy", 24968.98],
  ["Ministry of AYUSH", "Ministry of Ayush", 3712.49],
  ["Ministry of Chemicals and Fertilisers", "Department of Chemicals and Petrochemicals", 259.11],
  ["Ministry of Chemicals and Fertilisers", "Department of Fertilisers", 164150.81],
  ["Ministry of Chemicals and Fertilisers", "Department of Pharmaceuticals", 4089.95],
  ["Ministry of Civil Aviation", "Ministry of Civil Aviation", 2357.14],
  ["Ministry of Coal", "Ministry of Coal", 192.55],
  ["Ministry of Commerce and Industry", "Department of Commerce", 5014.06],
  ["Ministry of Commerce and Industry", "Department for Promotion of Industry and Internal Trade", 6455.08],
  ["Ministry of Communications", "Department of Posts", 25378.47],
  ["Ministry of Communications", "Department of Telecommunications", 111915.43],
  ["Ministry of Consumer Affairs, Food and Public Distribution", "Department of Consumer Affairs", 10303.61],
  ["Ministry of Consumer Affairs, Food and Public Distribution", "Department of Food and Public Distribution", 213019.75],
  ["Ministry of Cooperation", "Ministry of Cooperation", 1183.39],
  ["Ministry of Corporate Affairs", "Ministry of Corporate Affairs", 2667.06],
  ["Ministry of Culture", "Ministry of Culture", 3260.93],
  ["Ministry of Defence", "Ministry of Defence (Civil)", 25963.18],
  ["Ministry of Defence", "Defence Services (Revenue)", 282772.67],
  ["Ministry of Defence", "Capital Outlay on Defence Services", 172000],
  ["Ministry of Defence", "Defence Pensions", 141205],
  ["Ministry of Development of North Eastern Region", "Ministry of Development of North Eastern Region", 5900],
  ["Ministry of Earth Sciences", "Ministry of Earth Sciences", 3064.8],
  ["Ministry of Education", "Department of School Education and Literacy", 73008.1],
  ["Ministry of Education", "Department of Higher Education", 47619.77],
  ["Ministry of Electronics and Information Technology", "Ministry of Electronics and Information Technology", 21936.9],
  ["Ministry of Environment, Forests and Climate Change", "Ministry of Environment, Forests and Climate Change", 3330.37],
  ["Ministry of External Affairs", "Ministry of External Affairs", 22154.67],
  ["Ministry of Finance", "Department of Economic Affairs", 80272.91],
  ["Ministry of Finance", "Department of Expenditure", 504.14],
  ["Ministry of Finance", "Department of Financial Services", 2845.15],
  ["Ministry of Finance", "Department of Public Enterprises", 26.6],
  ["Ministry of Finance", "Department of Investment and Public Asset Management (DIPAM)", 49.74],
  ["Ministry of Finance", "Department of Revenue", 152093.79],
  ["Ministry of Finance", "Direct Taxes", 10338.38],
  ["Ministry of Finance", "Indirect Taxes", 41097.98],
  ["Ministry of Finance", "Indian Audit and Accounts Department", 5961.48],
  ["Ministry of Finance", "Interest Payments", 1162940.29],
  ["Ministry of Finance", "Repayment of Debt", 0],
  ["Ministry of Finance", "Pensions", 79241],
  ["Ministry of Finance", "Transfers to States", 322787.06],
  ["Ministry of Fisheries, Animal Husbandry and Dairying", "Department of Fisheries", 2616.44],
  ["Ministry of Fisheries, Animal Husbandry and Dairying", "Department of Animal Husbandry and Dairying", 4521.24],
  ["Ministry of Food Processing Industries", "Ministry of Food Processing Industries", 3290],
  ["Ministry of Health and Family Welfare", "Department of Health and Family Welfare", 87656.9],
  ["Ministry of Health and Family Welfare", "Department of Health Research", 3301.73],
  ["Ministry of Heavy Industries", "Ministry of Heavy Industries", 7242],
  ["Ministry of Home Affairs", "Ministry of Home Affairs", 6458.24],
  ["Ministry of Home Affairs", "Cabinet", 1248.91],
  ["Ministry of Home Affairs", "Police", 143275.9],
  ["Ministry of Home Affairs", "Andaman and Nicobar Islands", 5985.82],
  ["Ministry of Home Affairs", "Chandigarh", 5862.62],
  ["Ministry of Home Affairs", "Dadra and Nagar Haveli and Daman and Diu", 2648.97],
  ["Ministry of Home Affairs", "Ladakh", 5958],
  ["Ministry of Home Affairs", "Lakshadweep", 1490.1],
  ["Ministry of Home Affairs", "Transfers to Delhi", 1168.01],
  ["Ministry of Home Affairs", "Transfers to Jammu and Kashmir", 42277.74],
  ["Ministry of Home Affairs", "Transfers to Puducherry", 3269],
  ["Ministry of Housing and Urban Affairs", "Ministry of Housing and Urban Affairs", 82576.57],
  ["Ministry of Information and Broadcasting", "Ministry of Information and Broadcasting", 4342.55],
  ["Ministry of Jal Shakti", "Department of Water Resources, River Development and Ganga Rejuvenation", 21323.1],
  ["Ministry of Jal Shakti", "Department of Drinking Water and Sanitation", 77390.68],
  ["Ministry of Labour and Employment", "Ministry of Labour and Employment", 22531.47],
  ["Ministry of Law and Justice", "Law and Justice", 5940.95],
  ["Ministry of Law and Justice", "Election Commission", 321.89],
  ["Ministry of Law and Justice", "Supreme Court of India", 525.49],
  ["Ministry of Micro, Small and Medium Enterprises", "Ministry of Micro, Small and Medium Enterprises", 22137.95],
  ["Ministry of Mines", "Ministry of Mines", 1941.06],
  ["Ministry of Minority Affairs", "Ministry of Minority Affairs", 3183.24],
  ["Ministry of New and Renewable Energy", "Ministry of New and Renewable Energy", 19100],
  ["Ministry of Panchayati Raj", "Ministry of Panchayati Raj", 1183.64],
  ["Ministry of Parliamentary Affairs", "Ministry of Parliamentary Affairs", 64],
  ["Ministry of Personnel, Public Grievances and Pensions", "Ministry of Personnel, Public Grievances and Pensions", 2328.56],
  ["Ministry of Personnel, Public Grievances and Pensions", "Central Vigilance Commission", 51.31],
  ["Ministry of Petroleum and Natural Gas", "Ministry of Petroleum and Natural Gas", 15930.26],
  ["Ministry of Planning", "Ministry of Planning", 837.26],
  ["Ministry of Ports, Shipping and Waterways", "Ministry of Ports, Shipping and Waterways", 2377.49],
  ["Ministry of Power", "Ministry of Power", 20502],
  ["The President, Parliament, Union Public Service Commission and the Secretariat of the Vice President", "Staff, Household and Allowances of the President", 144.18],
  ["The President, Parliament, Union Public Service Commission and the Secretariat of the Vice President", "Lok Sabha", 862],
  ["The President, Parliament, Union Public Service Commission and the Secretariat of the Vice President", "Rajya Sabha", 441.42],
  ["The President, Parliament, Union Public Service Commission and the Secretariat of the Vice President", "Secretariat of the Vice-President", 11.61],
  ["The President, Parliament, Union Public Service Commission and the Secretariat of the Vice President", "Union Public Service Commission", 425.71],
  ["Ministry of Railways", "Ministry of Railways", 255393],
  ["Ministry of Road Transport and Highways", "Ministry of Road Transport and Highways", 278000],
  ["Ministry of Rural Development", "Department of Rural Development", 177566.19],
  ["Ministry of Rural Development", "Department of Land Resources", 2667.24],
  ["Ministry of Science and Technology", "Department of Science and Technology", 8029.01],
  ["Ministry of Science and Technology", "Department of Biotechnology", 2275.7],
  ["Ministry of Science and Technology", "Department of Scientific and Industrial Research", 6323.41],
  ["Ministry of Skill Development and Entrepreneurship", "Ministry of Skill Development and Entrepreneurship", 4520],
  ["Ministry of Social Justice and Empowerment", "Department of Social Justice and Empowerment", 13000.2],
  ["Ministry of Social Justice and Empowerment", "Department of Empowerment of Persons with Disabilities", 1225.27],
  ["Ministry of Social Justice and Empowerment", "Department of Space", 13042.75],
  ["Ministry of Statistics and Programme Implementation", "Ministry of Statistics and Programme Implementation", 5453.83],
  ["Ministry of Steel", "Ministry of Steel", 325.66],
  ["Ministry of Textiles", "Ministry of Textiles", 4417.03],
  ["Ministry of Tourism", "Ministry of Tourism", 2479.62],
  ["Ministry of Tribal Affairs", "Ministry of Tribal Affairs", 13000],
  ["Ministry of Women and Child Development", "Ministry of Women and Child Development", 26092.19],
  ["Ministry of Youth Affairs and Sports", "Ministry of Youth Affairs and Sports", 3442.32],
];

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const budgetEntries: BudgetEntry[] = sourceRows.map(
  ([ministry, department, amountCrore]) => ({
    id: slugify(department),
    ministry,
    department,
    amountCrore,
  }),
);

export const totalBudgetCrore = budgetEntries.reduce(
  (total, entry) => total + entry.amountCrore,
  0,
);

export function getDepartment(id: string) {
  return budgetEntries.find((entry) => entry.id === id);
}
