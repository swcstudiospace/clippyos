#!/usr/bin/env node
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

mkdirSync("/workspace/screenshots", { recursive: true });
const base = process.env.QA_URL || "http://127.0.0.1:8080";
const email = `suggest.${Date.now()}@example.com`;
const password = "password123";
const clientName = `Northstar ${Date.now().toString().slice(-6)}`;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(30000);
page.on("console", (msg) => {
  if (msg.type() === "error") console.log("console.error", msg.text());
});
page.on("pageerror", (error) => console.log("pageerror", error.message));
page.on("response", async (response) => {
  if (response.status() >= 400) {
    let body = "";
    try {
      body = (await response.text()).slice(0, 400);
    } catch {
      body = "(unreadable)";
    }
    console.log("http", response.status(), response.request().method(), response.url(), body);
  }
});

async function shot(name: string) {
  await page.screenshot({
    path: `/workspace/screenshots/${name}`,
    fullPage: true,
  });
  console.log("saved", name, "url=", page.url());
}

try {
  await page.goto(base, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Need an account? Create one" }).click();
  await page.getByLabel("Name").fill("Suggestions QA");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 25000 });

  await page.getByRole("link", { name: "Clients" }).click();
  await page.waitForURL("**/clients");
  await page.getByRole("button", { name: "Add Client" }).click();
  await page.getByRole("button", { name: "Enter details manually" }).click();
  await page.getByLabel("Name").fill(clientName);
  await page.getByLabel("Channel URL").fill("https://www.youtube.com/@veritasium");
  await page.getByLabel("Channel summary").fill(
    "Science storytelling channel that turns counterintuitive experiments into long-form explainers.",
  );
  await page.getByRole("button", { name: "Save client" }).click();
  await page.getByRole("heading", { name: "Add Client" }).waitFor({ state: "hidden", timeout: 20000 });
  if (!page.url().includes("/clients/")) {
    await page.getByRole("link", { name: clientName }).first().click();
  }
  await page.waitForURL(/\/clients\/[^/]+/, { timeout: 20000 });

  await page.getByRole("heading", { name: "Suggested Titles" }).waitFor();
  await page.getByRole("heading", { name: "Suggested Ideas" }).waitFor();
  await page.getByPlaceholder("Critique a title or paste a preferred example…").waitFor();
  await page.getByPlaceholder("Add an angle, example, or critique…").waitFor();
  await shot("qa-client-suggestions-empty.png");

  const ideasHeading = page.getByRole("heading", { name: "Suggested Ideas" });
  await ideasHeading.scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "Generate Ideas" }).last().click();
  await page.getByRole("button", { name: "Generating…" }).waitFor({ timeout: 8000 });
  await shot("qa-client-suggestions-generating.png");
  await page.getByRole("button", { name: "Regenerate" }).waitFor({ timeout: 120000 });
  const copyButtons = await page.getByRole("button", { name: /Copy/ }).count();
  const ideaHeadings = await page.locator("li p.text-body.font-medium").count();
  console.log({
    copyButtons,
    ideaHeadings,
    lastGenerated: await page.getByText(/Last generated/i).count(),
    bodySnippet: (await page.locator("main").innerText()).slice(0, 1800),
  });
  await shot("qa-client-suggestions-ideas.png");

  const detailUrl = page.url();
  await page.getByRole("link", { name: "Clients" }).first().click();
  await page.waitForURL("**/clients");
  await page.getByRole("link", { name: clientName }).first().click();
  await page.waitForURL(detailUrl, { timeout: 20000 });
  await page.getByRole("button", { name: "Regenerate" }).waitFor({ timeout: 15000 });
  await shot("qa-client-suggestions-persisted.png");

  await page.getByRole("button", { name: "Regenerate" }).click();
  await page.getByRole("heading", { name: "Replace suggested ideas?" }).waitFor();
  await page.getByRole("button", { name: "Cancel" }).click();

  const train = page.getByPlaceholder("Add an angle, example, or critique…");
  await train.fill("Prefer ideas that can hold a 12-minute runtime with a demo in the first 90 seconds.");
  await train.press("Enter");
  await page.getByText("Extracting principle…").waitFor({ timeout: 8000 });
  await page.waitForTimeout(20000);
  await shot("qa-client-suggestions-train.png");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);
  await ideasHeading.scrollIntoViewIfNeeded();
  await shot("qa-client-suggestions-mobile.png");
} catch (error) {
  console.error("QA failed", error);
  await shot("qa-client-suggestions-error.png");
  process.exitCode = 1;
} finally {
  await browser.close();
}
