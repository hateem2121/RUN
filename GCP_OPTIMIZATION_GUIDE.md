# Google Cloud Platform (GCP) Optimization Guide

This guide is designed to help you, as a site owner, manage your Google Cloud Console efficiently and keep costs low.

## 1. Customize Your Dashboard (Pinning Services)
To avoid getting lost in the menu, "pin" only the services your application actually uses.

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Click the **Navigation Menu** (three lines icon in the top-left).
3.  Hover over each of the following services and click the **Pin icon** (📌) next to them:
    *   **Cloud Run** (Where your website lives)
    *   **Cloud Storage** (Where images/files are stored)
    *   **BigQuery** (Where analytics/leads are saved)
    *   **Cloud Tasks** (Manages email sending)
    *   **Billing** (To track costs)

Now, these will always appear at the top of your menu.

## 2. Cost Control & Safety

### A. Set Up Budget Alerts (Critical)
This ensures you get an email if costs ever go higher than expected.

1.  Search for **"Budgets & alerts"** in the top search bar.
2.  Click **Create Budget**.
3.  **Name**: "Monthly Safety Net".
4.  **Amount**: Set a target (e.g., **$10** or **$20**).
5.  **Actions**: Ensure "Email alerts to billing admins" is checked.
6.  Click **Finish**.

### B. Cloud Storage (Images)
*   **Cost Tip**: Your storage costs are likely very low (cents per GB).
*   **Action**: No immediate action needed unless you have terabytes of data.

### C. BigQuery (Data)
*   **Cost Tip**: You are likely within the **Free Tier** (10GB storage/month is free).
*   **Action**: No action needed. It is extremely cheap for small datasets.

### D. Cloud Tasks (Emails)
*   **Cost Tip**: The first 1 million tasks (emails) per month are **free**.
*   **Action**: No action needed.

## 3. Summary of Your Stack
Here is what each piece does in simple terms:

| Service | What it does | Cost Status |
| :--- | :--- | :--- |
| **Cloud Run** | Runs your actual website code. | Scales to $0 when no one visits. |
| **NEON** | Holds your database (users, products). | **Free** (External service). |
| **Cloud Storage** | Stores uploaded images/assets. | Pay for what you store (very cheap). |
| **Cloud Tasks** | Ensures emails (contact form) get sent reliably. | **Free** (for your volume). |
| **BigQuery** | Records analytics and leads for future analysis. | **Free** (for your volume). |

## 4. What to Ignore
You will see hundreds of other services in Google Cloud (Compute Engine, Kubernetes, VPC, etc.). **Ignore them.** You do not need them, and clicking around won't accidentally buy them unless you explicitly "Create" something.
