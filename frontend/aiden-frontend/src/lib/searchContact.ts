export async function searchContact(query: string) {
  const q = query.toLowerCase().trim();

  const res = await fetch("/api/contacts");
  const data = await res.json();

  const contacts = data.connections || [];

  const cleaned = (str: string | undefined) =>
    str?.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim() || "";

  for (const c of contacts) {
    const rawName =
      c.names?.[0]?.displayName ||
      c.names?.[0]?.unstructuredName ||
      c.names?.[0]?.givenName ||
      c.names?.[0]?.familyName ||
      "";

    const cleanedName = cleaned(rawName);

    if (cleanedName.includes(cleaned(q))) {
      return {
        name: rawName,
        phone: c.phoneNumbers?.[0]?.value || null,
      };
    }
  }

  return null;
}
