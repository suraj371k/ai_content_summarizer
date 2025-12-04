import puppeteer from "puppeteer";
import Summary from "../models/summary.model.js";
import { initChatModel } from "langchain";

const model = await initChatModel("google-genai:gemini-2.5-pro", {
  apiKey: process.env.GEMINI_API_KEY,
  temperature: 0.5,
});

export const generateSummary = async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    );

    console.log(`Navigating to: ${url}`);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

    const data = await page.evaluate(() => {
      const elementsToRemove = document.querySelectorAll(
        "script, style, nav, header, footer, .advertisement, .ad"
      );
      elementsToRemove.forEach((el) => el.remove());

      const title =
        document.querySelector("h1")?.textContent?.trim() || document.title;

      const mainContent =
        document.querySelector("article")?.textContent ||
        document.querySelector("main")?.textContent ||
        document.querySelector(".post-content")?.textContent ||
        document.querySelector(".entry-content")?.textContent ||
        document.body.textContent;

      return { title, mainContent };
    });

    const cleanText = data.mainContent
      ?.replace(/\s+/g, " ")
      .trim()
      .substring(0, 7000);

  const prompt = `
You are an expert content analyst and summarizer. Your task is to create a comprehensive, structured summary of the following article.

**Instructions:**
- Provide an in-depth analysis that captures the essence and key takeaways
- Use clear headings and subheadings to organize information
- Include relevant examples, statistics, or quotes when they add value
- Highlight actionable insights or practical implications
- Maintain objectivity and accuracy
- Format using Markdown for readability (## for sections, ### for subsections, - for lists, **bold** for emphasis)

**Structure your summary as follows:**

## Overview
[2-3 sentence high-level summary of the main topic and purpose]

## Key Points
- [Main idea 1 with supporting details]
- [Main idea 2 with supporting details]
- [Main idea 3 with supporting details]
[Continue as needed]

## Detailed Breakdown
[Provide deeper analysis of important sections, including:]
- Context and background
- Core arguments or findings
- Supporting evidence or examples
- Implications or significance

## Examples & Illustrations
[Include specific examples, case studies, or data points mentioned in the article]

## Takeaways
- [Practical insight 1]
- [Practical insight 2]
- [Practical insight 3]

## Conclusion
[Final thoughts on the article's significance and relevance]

---

**Article Title:** ${data.title}

**Content:**
${cleanText}

---

Begin your structured summary now. Do not include meta-commentary like "Here is the summary" or disclaimers.
`;
 
    const summarizeText = await model.invoke(prompt);

    const finalSummary = summarizeText.content;

    const result = await Summary.create({
      url,
      title: data.title,
      summary: finalSummary,
    })

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.log("Error in scrapping: ", error);
    res.status(500).json({ success: false, message: "internal server error" });
  } finally {
    if (browser) await browser.close();
  }
};

export const getSummary = async (req, res) => {
  try {
    const summaries = await Summary.find().sort({createdAt: -1})

    if (!summaries) {
      return res
        .status(404)
        .json({ success: false, message: "summary not found" });
    }

    return res.status(200).json({ success: true, data: summaries });
  } catch (error) {
    console.log("Error in get summary: ", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const getSummaryById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res
        .status(404)
        .json({ success: false, message: "summary not found" });
    }

    const summary = await Summary.findById(id);

    return res.status(200).json({ success: true, data: summary });
  } catch (error) {
    console.log("Error in get summary by id controller", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const deleteSummary = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res
        .status(404)
        .json({ success: false, message: "summary not found" });
    }

    await Summary.findByIdAndDelete(id);

    return res
      .status(200)
      .json({ success: true, message: "summary deleted successfully" });
  } catch (error) {
    console.log("Error in delete summary controller: ", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const updateSummary = async (req, res) => {
  try {
    const { id } = req.params;

    const { title, summary } = req.body;

    const updated = await Summary.findByIdAndUpdate(
      id,
      { title, summary },
      { new: true } 
    );

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Summary not found" });
    }

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.log("Error in update summary controller:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
