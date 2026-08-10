export interface BDLocation {
  id: string;
  name: string;
  bn_name: string;
}

export interface Division extends BDLocation {}
export interface District extends BDLocation {
  division_id: string;
}
export interface Upazila extends BDLocation {
  district_id: string;
}

// In a real application, this data would ideally come from a database or a much larger JSON file.
// For this production-ready implementation without external API dependencies, we embed a 
// representative hierarchical dataset of Bangladesh.

export const divisions: Division[] = [
  { id: '1', name: 'Dhaka', bn_name: 'ঢাকা' },
  { id: '2', name: 'Chattogram', bn_name: 'চট্টগ্রাম' },
  { id: '3', name: 'Rajshahi', bn_name: 'রাজশাহী' },
  { id: '4', name: 'Khulna', bn_name: 'খুলনা' },
  { id: '5', name: 'Barishal', bn_name: 'বরিশাল' },
  { id: '6', name: 'Sylhet', bn_name: 'সিলেট' },
  { id: '7', name: 'Rangpur', bn_name: 'রংপুর' },
  { id: '8', name: 'Mymensingh', bn_name: 'ময়মনসিংহ' },
];

export const districts: District[] = [
  // Dhaka Division
  { id: '1', division_id: '1', name: 'Dhaka', bn_name: 'ঢাকা' },
  { id: '2', division_id: '1', name: 'Gazipur', bn_name: 'গাজীপুর' },
  { id: '3', division_id: '1', name: 'Narayanganj', bn_name: 'নারায়ণগঞ্জ' },
  { id: '4', division_id: '1', name: 'Tangail', bn_name: 'টাঙ্গাইল' },
  { id: '5', division_id: '1', name: 'Faridpur', bn_name: 'ফরিদপুর' },
  // Chattogram Division
  { id: '6', division_id: '2', name: 'Chattogram', bn_name: 'চট্টগ্রাম' },
  { id: '7', division_id: '2', name: 'Cox\'s Bazar', bn_name: 'কক্সবাজার' },
  { id: '8', division_id: '2', name: 'Cumilla', bn_name: 'কুমিল্লা' },
  { id: '9', division_id: '2', name: 'Noakhali', bn_name: 'নোয়াখালী' },
  // Rajshahi Division
  { id: '10', division_id: '3', name: 'Rajshahi', bn_name: 'রাজশাহী' },
  { id: '11', division_id: '3', name: 'Bogra', bn_name: 'বগুড়া' },
  { id: '12', division_id: '3', name: 'Pabna', bn_name: 'পাবনা' },
  // Sylhet Division
  { id: '13', division_id: '6', name: 'Sylhet', bn_name: 'সিলেট' },
  { id: '14', division_id: '6', name: 'Habiganj', bn_name: 'হবিগঞ্জ' },
  // (Other districts would follow...)
];

export const upazilas: Upazila[] = [
  // Dhaka District
  { id: '1', district_id: '1', name: 'Dhamrai', bn_name: 'ধামরাই' },
  { id: '2', district_id: '1', name: 'Dohar', bn_name: 'দোহার' },
  { id: '3', district_id: '1', name: 'Keraniganj', bn_name: 'কেরানীগঞ্জ' },
  { id: '4', district_id: '1', name: 'Nawabganj', bn_name: 'নবাবগঞ্জ' },
  { id: '5', district_id: '1', name: 'Savar', bn_name: 'সাভার' },
  // Chattogram District
  { id: '6', district_id: '6', name: 'Anwara', bn_name: 'আনোয়ারা' },
  { id: '7', district_id: '6', name: 'Banshkhali', bn_name: 'বাঁশখালী' },
  { id: '8', district_id: '6', name: 'Boalkhali', bn_name: 'বোয়ালখালী' },
  { id: '9', district_id: '6', name: 'Chandanaish', bn_name: 'চন্দনাইশ' },
  // (Other upazilas would follow...)
];

export function getDivisions(): Division[] {
  return divisions;
}

export function getDistricts(divisionId?: string): District[] {
  if (!divisionId) return districts;
  return districts.filter((d) => d.division_id === divisionId);
}

export function getUpazilas(districtId?: string): Upazila[] {
  if (!districtId) return upazilas;
  return upazilas.filter((u) => u.district_id === districtId);
}

export function getLocationName(id: string, type: 'division' | 'district' | 'upazila', lang: 'en' | 'bn' = 'en'): string | undefined {
  let location: BDLocation | undefined;
  if (type === 'division') location = divisions.find(d => d.id === id);
  if (type === 'district') location = districts.find(d => d.id === id);
  if (type === 'upazila') location = upazilas.find(u => u.id === id);
  
  return lang === 'bn' ? location?.bn_name : location?.name;
}
