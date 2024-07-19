import { getContacts, createContact, getContact } from "../contacts";
import { updateContact } from "../contacts";
import { redirect } from "react-router-dom";

export async function rootLoader() {
  const contacts = await getContacts();
  return { contacts };
}

export async function rootAction() {
  const contact = await createContact();
  return { contact };
}

export async function contactLoader({ params }) {
  const contact = await getContact(params.contactId);
  return { contact };
}

export async function editAction({ request, params }) {
  const formData = await request.formData();
  const updates = Object.fromEntries(formData);
  await updateContact(params.contactId, updates);
  return redirect(`/contacts/${params.contactId}`);
}
