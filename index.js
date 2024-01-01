const { default: axios } = require("axios");
const nodemailer = require("nodemailer");
const cheerio = require("cheerio");
const cron = require("node-cron");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.COMPANY_EMAIL,
    pass: process.env.COMPANY_EMAIL_PASSWORD,
  },
});

async function getFirstHref() {
  try {
    const response = await axios.get(
      "https://www.stsci.edu/jwst/science-execution/observing-schedules"
    );
    const html = response.data;

    const $ = cheerio.load(html);

    // Assuming the first href is within a specific element (adjust selector as needed)
    const firstHref = $(
      'a[href^="/files/live/sites/www/files/home/jwst/science-execution/observing-schedules/_documents/"]'
    )
      .first()
      .attr("href");
    return firstHref;
  } catch (error) {
    console.error("Error fetching or parsing HTML:", error);
    return null;
  }
}

async function sendEmail(documentLink, documentContent) {
  const mailOptions = {
    from: process.env.COMPANY_EMAIL,
    to: "rhettjwilliams@gmail.com",
    subject: "TRAPPIST-1 Observation Found!",
    text: `TRAPPIST-1 observation found in latest schedule:\n${documentLink}\n\nDocument content:\n${documentContent}`,
  };

  await transporter.sendMail(mailOptions);
  console.log("Email sent successfully!");
}

const isTrappistBeingSearched = async () => {
  try {
    const newUrl = await getFirstHref();
    console.log("the url", newUrl);
    const data = await axios.get(`https://www.stsci.edu${newUrl}`);
    if (data.data.toLowerCase().includes("trappist")) {
      await sendEmail(`https://www.stsci.edu${newUrl}`, data.data);
      console.log("email sent! we finding aliens boiiiss");
    }
  } catch (error) {
    console.log("err", error);
  }
};

cron.schedule("0 8 * * *", isTrappistBeingSearched);
