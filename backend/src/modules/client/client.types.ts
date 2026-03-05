export interface CreateClientInput {
  name: string;
  contact?: string;
  address?: string;
  city?: string;
  country?: string;
}

export interface UpdateClientInput {
  name?: string;
  contact?: string;
  address?: string;
  city?: string;
  country?: string;
}
