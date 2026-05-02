import { supabase } from "../lib/supabaseClient.js";
import {
  SAMPLE_PROPERTIES,
  SAMPLE_BOOKINGS,
  SAMPLE_GUESTS,
  SAMPLE_CLEANING,
  SAMPLE_MAINTENANCE,
  SAMPLE_SUPPLIES,
  SAMPLE_EXPENSES,
  SAMPLE_LEADS,
  DEFAULT_SETTINGS,
} from "../data/sampleData.js";

const USER_DATA_TABLES = [
  "tax_reserve_records",
  "owner_reports",
  "direct_booking_leads",
  "expenses",
  "supplies",
  "maintenance_issues",
  "cleaning_tasks",
  "bookings",
  "guests",
  "properties",
  "settings",
];

async function getCurrentUserId() {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  const userId = data?.user?.id;

  if (!userId) {
    throw new Error("You must be logged in to reset account data.");
  }

  return userId;
}

function attachUserId(rows, userId) {
  return rows.map((row) => ({
    ...row,
    user_id: userId,
  }));
}

export async function resetAccountToBlank() {
  const userId = await getCurrentUserId();

  for (const table of USER_DATA_TABLES) {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Could not clear ${table}: ${error.message}`);
    }
  }

  return true;
}

export async function resetAccountToSampleData() {
  const userId = await getCurrentUserId();

  await resetAccountToBlank();

  const inserts = [
    {
      table: "properties",
      rows: attachUserId(SAMPLE_PROPERTIES, userId),
    },
    {
      table: "guests",
      rows: attachUserId(SAMPLE_GUESTS, userId),
    },
    {
      table: "bookings",
      rows: attachUserId(SAMPLE_BOOKINGS, userId),
    },
    {
      table: "cleaning_tasks",
      rows: attachUserId(SAMPLE_CLEANING, userId),
    },
    {
      table: "maintenance_issues",
      rows: attachUserId(SAMPLE_MAINTENANCE, userId),
    },
    {
      table: "supplies",
      rows: attachUserId(SAMPLE_SUPPLIES, userId),
    },
    {
      table: "expenses",
      rows: attachUserId(SAMPLE_EXPENSES, userId),
    },
    {
      table: "direct_booking_leads",
      rows: attachUserId(SAMPLE_LEADS, userId),
    },
    {
      table: "settings",
      rows: [
        {
          user_id: userId,
          default_currency: DEFAULT_SETTINGS.default_currency || "JMD",
          airbnb_currency: DEFAULT_SETTINGS.airbnb_currency || "USD",
          platform_fee_percentage:
            DEFAULT_SETTINGS.platform_fee_percentage || 0.03,
          management_fee_percentage:
            DEFAULT_SETTINGS.management_fee_percentage || 0.15,
          tax_reserve_percentage:
            DEFAULT_SETTINGS.tax_reserve_percentage || 0.15,
          default_checkin_time: DEFAULT_SETTINGS.default_checkin_time || "15:00",
          default_checkout_time:
            DEFAULT_SETTINGS.default_checkout_time || "11:00",
          host_name: DEFAULT_SETTINGS.host_name || "Your Host Name",
          host_phone: DEFAULT_SETTINGS.host_phone || "",
          host_email: DEFAULT_SETTINGS.host_email || "",
          business_name:
            DEFAULT_SETTINGS.business_name || "Your Hospitality Co.",
        },
      ],
    },
  ];

  for (const insert of inserts) {
    if (!insert.rows || insert.rows.length === 0) continue;

    const { error } = await supabase.from(insert.table).insert(insert.rows);

    if (error) {
      throw new Error(`Could not load ${insert.table}: ${error.message}`);
    }
  }

  return true;
}
