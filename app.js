const puppy = require("puppeteer");
const xlsx = require("xlsx");
const fs = require("fs");
const cheerio = require("cheerio");
const url = "https://dashboard.cowin.gov.in/";
const myAddress = "Clock Tower Dehradun";
const nodemailer = require("nodemailer");

const pin = "248001";
let finalData = [];
async function main() {
  let browser = await puppy.launch({ headless: false, defaultViewport: false }); //headless:false so we can watch the browser as it works
  let tab = await browser.newPage(); //open a new page
  await tab.goto(url);
  // click on states dropdown

  await tab.click(".dropdown_states");
  await tab.type("select#state", "Uttarakhand");
  await tab.keyboard.press("Enter");

  // click on district dropdown

  await tab.click(".dropdown_districts");
  await tab.type("select#district", "Dehradun");
  await tab.keyboard.press("Enter");
  //await tab.waitForNavigation({ waitUntil: "networkidle2" });

  await tab.waitForTimeout(4000);

  await scrapeTable(tab);
  googleMaps(tab);
}

async function scrapeTable(tab) {
  let episodes_details = await tab.evaluate(() => {
    //Extract each episode's basic details
    let table = document.querySelector(".table-body.rep-tb-body");
    let episode_panels = Array.from(table.children);

    // Loop through each episode and get their details
    let episodes_info = episode_panels.map((episode_panel) => {
      let centers = episode_panel.querySelector(".title").textContent;
      let today = episode_panel.querySelector(".text-right").textContent;
      return { centers, today };
    });
    return episodes_info;
  });

  finalData.push(episodes_details);
  let newFinalData = finalData.flat(); // convert multidimensional aray into a 1D array
  var myJSON = JSON.stringify(newFinalData);
  fs.writeFileSync("temp.json", myJSON);

  // convert it into excel file
  let content = JSON.parse(fs.readFileSync("./temp.json", "utf-8"));
  let newWB = xlsx.utils.book_new();
  let newWS = xlsx.utils.json_to_sheet(content);
  xlsx.utils.book_append_sheet(newWB, newWS, "shubham");
  xlsx.writeFile(newWB, "dangwal.xlsx");
}

main();

async function googleMaps(tab) {
  let input = "Vaccination Centres Near me Dehradun";
  await tab.goto("https://www.google.com/maps");
  await tab.type("#searchboxinput", input);
  await tab.click(".searchbox-directions-container");
  await tab.waitForSelector("#directions-searchbox-0");
  await tab.type("#directions-searchbox-0", "Clock Tower Dehradun");
  await tab.keyboard.press("Enter");
  await tab.waitForNavigation({ waitUntil: "networkidle2" });

  // take screenshot
  await tab.setViewport({ width: 1024, height: 800 });
  await tab.screenshot({
    path: "./screenshot1.jpg",
    type: "jpeg",
    fullPage: true,
  });
  await tab.waitForSelector(
    ".section-directions-trip-details-link.noprint.mapsConsumerUiCommonButton__blue-button-text",
    { visible: true }
  );
  await tab.click(
    ".section-directions-trip-details-link.noprint.mapsConsumerUiCommonButton__blue-button-text"
  );
  await tab.waitForSelector(
    ".mapsTactileClientSubviewSectionActionDirectionsdetailsaction__section-directions-details-action-button.mapsConsumerUiIconsCssPaneaction__maps-sprite-pane-action-ic-share-black"
  );
  await tab.click(
    ".mapsTactileClientSubviewSectionActionDirectionsdetailsaction__section-directions-details-action-button.mapsConsumerUiIconsCssPaneaction__maps-sprite-pane-action-ic-share-black"
  );
  await tab.waitForSelector(
    ".mapsTactileClientSubviewSectionCopylink__section-copy-link-copy-button.mapsConsumerUiCommonButton__blue-button-text"
  );
  await tab.click(
    ".mapsTactileClientSubviewSectionCopylink__section-copy-link-copy-button.mapsConsumerUiCommonButton__blue-button-text"
  );
  await tab.keyboard.down("Control");
  await tab.keyboard.press("C");
  let inputt = await tab.$("input.section-copy-link-input");
  let link = await inputt.evaluate(function (e) {
    return e.getAttribute("value");
  });
  //console.log(link);
  mail(link);
}

async function mail(link) {
  const transporter = nodemailer.createTransport({
    service: "hotmail",
    auth: {
      user: "dangwalshubhamnodejs@outlook.com",
      pass: "sdugs123",
    },
  });

  const options = {
    from: "dangwalshubhamnodejs@outlook.com",
    to: "ssecutities@gmail.com",
    subject: "Link to the nearest Vaccination available around You!",
    text: link,

    attachments: [
      {
        filename: "map.jpg",
        path: "D:/pepcoding/Hackathon1/screenshot1.jpg",
      },
      {
        filename: "details.xlsx",
        path: "D:/pepcoding/Hackathon1/dangwal.xlsx",
      },
      {
        filename: "site.jpg",
        path: "D:/pepcoding/Hackathon1/screenshot.jpg",
      },
    ],
  };

  transporter.sendMail(options, function (err, info) {
    if (err) {
      console.log(err);
      return;
    }
    console.log("Sent: " + info.response);
  });
}
