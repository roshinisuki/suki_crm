/**
 * Meta Graph API client for Facebook, Instagram, and WhatsApp.
 * Handles token management and API calls.
 */

const GRAPH_API_BASE = "https://graph.facebook.com";

export interface MetaGraphConfig {
  appId: string;
  appSecret: string;
  pageAccessToken: string;
  apiVersion: string;
  whatsappPhoneNumberId?: string;
  whatsappAccessToken?: string;
}

/**
 * Get Meta configuration from environment variables.
 */
export function getMetaConfig(): MetaGraphConfig {
  return {
    appId: process.env.META_APP_ID || "",
    appSecret: process.env.META_APP_SECRET || "",
    pageAccessToken: process.env.META_PAGE_ACCESS_TOKEN || "",
    apiVersion: process.env.META_GRAPH_API_VERSION || "v23.0",
    whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN,
  };
}

/**
 * Make a GET request to Meta Graph API.
 */
export async function metaGraphGet<T>(
  endpoint: string,
  accessToken: string,
  params?: Record<string, string>
): Promise<T | null> {
  const config = getMetaConfig();
  const url = new URL(`${GRAPH_API_BASE}/${config.apiVersion}${endpoint}`);
  
  url.searchParams.append("access_token", accessToken);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error(`Meta Graph API error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error("Error details:", errorText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Meta Graph API request failed:", error);
    return null;
  }
}

/**
 * Fetch full lead data from Meta Graph API using leadgen_id.
 */
export async function fetchLeadData(leadgenId: string): Promise<any | null> {
  const config = getMetaConfig();
  
  return metaGraphGet(
    `/${leadgenId}`,
    config.pageAccessToken,
    {
      fields: "created_time,id,ad_id,form_id,field_data,platform",
    }
  );
}

/**
 * Fetch media URL from WhatsApp Cloud API.
 */
export async function fetchWhatsAppMediaUrl(mediaId: string): Promise<string | null> {
  const config = getMetaConfig();
  if (!config.whatsappAccessToken) {
    return null;
  }

  const result = await metaGraphGet<{ url?: string }>(
    `/${mediaId}`,
    config.whatsappAccessToken
  );

  return result?.url || null;
}
