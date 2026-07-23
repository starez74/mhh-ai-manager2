export type Customer = {
  id: string;
  created_at: string;
  archived_at?: string | null;
  name: string;
  phone: string;
  email: string;
  preferred_contact: string;
  address: string;
  notes: string;
  status: string;
};

export type CustomerInput = Pick<
  Customer,
  "name" | "phone" | "email" | "preferred_contact" | "address" | "notes"
>;
