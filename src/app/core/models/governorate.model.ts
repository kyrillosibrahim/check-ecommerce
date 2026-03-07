export interface IGovernorateApi {
  id: number;
  governorate_name_en: string;
  governorate_name_ar: string;
  shippingCost: number;
}

export interface ICityApi {
  id: number;
  governorate_id: number;
  city_name_en: string;
  city_name_ar: string;
}
