export interface PendingUpdateValues {
  landbankArea: string;
  landbankGfa: string;
  plotStatusEnglish: string;
  ownershipTypeEnglish: string;
  contractStatusEnglish: string;
  developerEnglish: string;
  leaseTypeEnglish: string;
  userEnglishName: string;
  contractNo: string;
}

export interface PendingUpdateRecord extends PendingUpdateValues {
  id: string;
  plotId: string;
  objectId: number | null;
  editor: string;
  ceo: string;
  gm: string;
  pm: string;
  status: string;
  savedAt: string;
}