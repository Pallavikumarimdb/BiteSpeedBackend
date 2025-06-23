import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface IdentifyRequest {
  email?: string | null;
  phoneNumber?: string | null;
}

interface FormattedContact {
  primaryContatctId: number;
  emails: string[];
  phoneNumbers: string[];
  secondaryContactIds: number[];
}

export async function handleIdentify({ email, phoneNumber }: IdentifyRequest): Promise<FormattedContact> {
  const contacts = await prisma.contact.findMany({
    where: {
      OR: [
        { email: email ?? undefined },
        { phoneNumber: phoneNumber ?? undefined },
      ]
    },
    orderBy: { createdAt: 'asc' } 
  });
  if (contacts.length === 0) {
    const newContact = await prisma.contact.create({
      data: {
        email: email ?? undefined,
        phoneNumber: phoneNumber ?? undefined,
        linkPrecedence: 'primary'
      }
    });
    return {
      primaryContatctId: newContact.id,
      emails: newContact.email ? [newContact.email] : [],
      phoneNumbers: newContact.phoneNumber ? [newContact.phoneNumber] : [],
      secondaryContactIds: []
    };
  }

  const primary = contacts[0];

  let emails = new Set<string>();
  let phoneNumbers = new Set<string>();
  let secondaryContactIds: number[] = [];


  for (const contact of contacts) {
    if (contact.id !== primary.id && !contact.linkedId) {
      await prisma.contact.update({
        where: { id: contact.id },
        data: {
          linkedId: primary.id,
          linkPrecedence: 'secondary'
        }
      });
    }
    if (contact.email) emails.add(contact.email);
    if (contact.phoneNumber) phoneNumbers.add(contact.phoneNumber);
    if (contact.id !== primary.id) {
      secondaryContactIds.push(contact.id);
    }
  }

  let createNew = false;
  if (email && !emails.has(email)) {
    createNew = true;
  }
  if (phoneNumber && !phoneNumbers.has(phoneNumber)) {
    createNew = true;
  }
  if (createNew) {
    const newSecondary = await prisma.contact.create({
      data: {
        email: email && !emails.has(email) ? email : undefined,
        phoneNumber: phoneNumber && !phoneNumbers.has(phoneNumber) ? phoneNumber : undefined,
        linkedId: primary.id,
        linkPrecedence: 'secondary'
      }
    });
    if (newSecondary.email) emails.add(newSecondary.email);
    if (newSecondary.phoneNumber) phoneNumbers.add(newSecondary.phoneNumber);
    secondaryContactIds.push(newSecondary.id);
  }

  return {
    primaryContatctId: primary.id,
    emails: Array.from(emails),
    phoneNumbers: Array.from(phoneNumbers),
    secondaryContactIds: secondaryContactIds
  };
}
