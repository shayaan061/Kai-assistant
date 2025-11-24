export async function searchContact(query: string) {
  const res = await fetch("/api/contacts");
  const data = await res.json();

  const contacts = data.connections || [];

  const match = contacts.find((c: any) => {
    const name = c.names?.[0]?.displayName?.toLowerCase() || "";
    return name.includes(query.toLowerCase());
  });

  if (!match) return null;

  return {
    name: match.names?.[0]?.displayName,
    phone: match.phoneNumbers?.[0]?.value,
  };
}
