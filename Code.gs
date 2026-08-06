/*******************************************************
 * AUTOMATED INVENTORY CONTROL SYSTEM
 * GitHub / Demo Version
 *
 * Google Sheet structure:
 *
 * Row 1:
 * A = Sr. No
 * B = Item Name
 * C = UOM
 * D = Total Bought
 * E = Total Consumed
 * F = Total Left
 * G = Min Threshold
 *
 *******************************************************/

const CONFIG = {
  MAIN_SHEET_NAME: "Sheet1",
  HEADER_ROW: 1,
  DATA_START_ROW: 2,

  CONSUMPTION_LOG_SHEET: "Consumption Log",
  PURCHASE_LOG_SHEET: "Purchase Log",

  DATE_FORMAT: "dd-MMM-yyyy",

  REQUIRED_HEADERS: [
    "Sr. No",
    "Item Name",
    "UOM",
    "Total Bought",
    "Total Consumed",
    "Total Left",
    "Min Threshold"
  ]
};


/* =====================================================
   WEB APP
   ===================================================== */

function doGet() {
  return HtmlService
    .createTemplateFromFile("InventoryForm")
    .evaluate()
    .setTitle("Automated Inventory Control System")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}


/* =====================================================
   INITIAL DATA
   ===================================================== */

function getInitialData() {

  const sheet = getMainSheet();
  validateHeaders(sheet);

  const items = getInventoryItems(sheet);

  const profile = getUserProfile();

  return {
    success: true,
    companyName: profile.companyName,
    userName: profile.userName,
    receiptEmail: profile.receiptEmail,
    userEmail: getCurrentUserEmail(),
    date: formatDate(new Date()),
    items: items
  };
}


/* =====================================================
   PROFILE / EDIT SETTINGS
   ===================================================== */

function getUserProfile() {

  const properties = PropertiesService.getUserProperties();

  return {
    companyName:
      properties.getProperty("COMPANY_NAME") || "",

    userName:
      properties.getProperty("USER_NAME") || "",

    receiptEmail:
      properties.getProperty("RECEIPT_EMAIL") || ""
  };
}


function saveUserProfile(companyName, userName, receiptEmail) {

  companyName = String(companyName || "").trim();
  userName = String(userName || "").trim();
  receiptEmail = String(receiptEmail || "").trim();

  if (!companyName) {
    throw new Error("Company name is required.");
  }

  if (!userName) {
    throw new Error("User name is required.");
  }

  if (!receiptEmail) {
    throw new Error("Receipt email is required.");
  }

  if (!isValidEmail(receiptEmail)) {
    throw new Error("Please enter a valid receipt email address.");
  }

  const properties =
    PropertiesService.getUserProperties();

  properties.setProperty(
    "COMPANY_NAME",
    companyName
  );

  properties.setProperty(
    "USER_NAME",
    userName
  );

  properties.setProperty(
    "RECEIPT_EMAIL",
    receiptEmail
  );

  return {
    success: true,

    companyName:
      companyName,

    userName:
      userName,

    receiptEmail:
      receiptEmail
  };
}


function isValidEmail(email) {

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

}


/* =====================================================
   INVENTORY READING
   ===================================================== */

function getMainSheet() {

  const spreadsheet =
    SpreadsheetApp.getActiveSpreadsheet();

  let sheet =
    spreadsheet.getSheetByName(
      CONFIG.MAIN_SHEET_NAME
    );

  if (!sheet) {

    const sheets =
      spreadsheet.getSheets();

    if (sheets.length === 0) {
      throw new Error(
        "No Google Sheets worksheet was found."
      );
    }

    sheet = sheets[0];
  }

  return sheet;
}


function validateHeaders(sheet) {

  const lastColumn =
    sheet.getLastColumn();

  if (
    lastColumn <
    CONFIG.REQUIRED_HEADERS.length
  ) {

    throw new Error(
      "The sheet does not contain enough columns. " +
      "Expected columns A:G."
    );

  }

  const headers =
    sheet
      .getRange(
        CONFIG.HEADER_ROW,
        1,
        1,
        CONFIG.REQUIRED_HEADERS.length
      )
      .getDisplayValues()[0]
      .map(function(header) {

        return String(
          header || ""
        ).trim();

      });

  const missing = [];

  CONFIG.REQUIRED_HEADERS.forEach(
    function(requiredHeader) {

      if (
        headers.indexOf(
          requiredHeader
        ) === -1
      ) {

        missing.push(
          requiredHeader
        );

      }

    }
  );

  if (missing.length > 0) {

    throw new Error(
      "The following required columns were not found in row 1:\n\n" +
      missing.join(", ")
    );

  }

}


function getInventoryItems(sheet) {

  const lastRow =
    sheet.getLastRow();

  if (
    lastRow <
    CONFIG.DATA_START_ROW
  ) {

    return [];

  }

  const numberOfRows =
    lastRow -
    CONFIG.DATA_START_ROW +
    1;

  const values =
    sheet
      .getRange(
        CONFIG.DATA_START_ROW,
        1,
        numberOfRows,
        CONFIG.REQUIRED_HEADERS.length
      )
      .getValues();

  const items = [];

  values.forEach(
    function(row, index) {

      const serialNumber =
        String(
          row[0] || ""
        ).trim();

      const itemName =
        String(
          row[1] || ""
        ).trim();

      const uom =
        String(
          row[2] || ""
        ).trim();

      if (
        !serialNumber &&
        !itemName
      ) {

        return;

      }

      const rowNumber =
        CONFIG.DATA_START_ROW +
        index;

      const totalBought =
        toNumber(row[3]);

      const totalConsumed =
        toNumber(row[4]);

      const totalLeft =
        toNumber(row[5]);

      const minThreshold =
        toNumber(row[6]);

      items.push({

        rowNumber:
          rowNumber,

        serialNumber:
          serialNumber,

        itemName:
          itemName,

        uom:
          uom,

        totalBought:
          totalBought,

        totalConsumed:
          totalConsumed,

        totalLeft:
          totalLeft,

        minThreshold:
          minThreshold,

        lowStock:
          totalLeft <=
          minThreshold

      });

    }
  );

  return items;
}


/* =====================================================
   SAVE DAILY REPORT
   ===================================================== */

function submitDailyReport(
  consumptionData,
  purchaseData
) {

  const lock =
    LockService.getScriptLock();

  lock.waitLock(30000);

  try {

    const sheet =
      getMainSheet();

    validateHeaders(sheet);

    const profile =
      getUserProfile();

    if (!profile.companyName) {

      throw new Error(
        "Please enter the company name using Edit before submitting."
      );

    }

    if (!profile.userName) {

      throw new Error(
        "Please enter the user name using Edit before submitting."
      );

    }

    if (!profile.receiptEmail) {

      throw new Error(
        "Please enter the receipt email using Edit before submitting."
      );

    }

    if (!isValidEmail(profile.receiptEmail)) {

      throw new Error(
        "The saved receipt email is invalid. Please update it using Edit."
      );

    }

    const consumption =
      normalizeEntries(
        consumptionData
      );

    const purchases =
      normalizeEntries(
        purchaseData
      );

    const changes = [];


    /* -----------------------------------------------
       CONSUMPTION
       ----------------------------------------------- */

    consumption.forEach(
      function(entry) {

        const row =
          entry.rowNumber;

        const quantity =
          entry.quantity;

        if (quantity <= 0) {

          throw new Error(
            "Quantity used must be greater than zero."
          );

        }

        const currentLeft =
          toNumber(
            sheet
              .getRange(row, 6)
              .getValue()
          );

        const currentConsumed =
          toNumber(
            sheet
              .getRange(row, 5)
              .getValue()
          );

        if (
          quantity >
          currentLeft
        ) {

          const itemName =
            sheet
              .getRange(row, 2)
              .getDisplayValue();

          throw new Error(
            "You cannot consume " +
            quantity +
            " " +
            sheet
              .getRange(row, 3)
              .getDisplayValue() +
            " of " +
            itemName +
            ". Only " +
            currentLeft +
            " remains."
          );

        }

        changes.push({

          rowNumber:
            row,

          oldTotalConsumed:
            currentConsumed,

          oldTotalLeft:
            currentLeft,

          newTotalConsumed:
            currentConsumed +
            quantity,

          newTotalLeft:
            currentLeft -
            quantity

        });

      }
    );


    /* -----------------------------------------------
       PURCHASES
       ----------------------------------------------- */

    purchases.forEach(
      function(entry) {

        const row =
          entry.rowNumber;

        const quantity =
          entry.quantity;

        if (quantity <= 0) {

          throw new Error(
            "Purchased quantity must be greater than zero."
          );

        }

        const currentBought =
          toNumber(
            sheet
              .getRange(row, 4)
              .getValue()
          );

        const currentLeft =
          toNumber(
            sheet
              .getRange(row, 6)
              .getValue()
          );

        const existingChange =
          changes.find(
            function(change) {

              return (
                change.rowNumber === row
              );

            }
          );

        if (existingChange) {

          existingChange.newTotalBought =
            currentBought +
            quantity;

          existingChange.newTotalLeft =
            existingChange.newTotalLeft +
            quantity;

        } else {

          changes.push({

            rowNumber:
              row,

            oldTotalBought:
              currentBought,

            oldTotalLeft:
              currentLeft,

            newTotalBought:
              currentBought +
              quantity,

            newTotalLeft:
              currentLeft +
              quantity

          });

        }

      }
    );


    /* -----------------------------------------------
       APPLY CHANGES
       ----------------------------------------------- */

    changes.forEach(
      function(change) {

        const row =
          change.rowNumber;

        if (
          change.newTotalBought !==
          undefined
        ) {

          sheet
            .getRange(row, 4)
            .setValue(
              change.newTotalBought
            );

        }

        if (
          change.newTotalConsumed !==
          undefined
        ) {

          sheet
            .getRange(row, 5)
            .setValue(
              change.newTotalConsumed
            );

        }

        if (
          change.newTotalLeft !==
          undefined
        ) {

          sheet
            .getRange(row, 6)
            .setValue(
              change.newTotalLeft
            );

        }

      }
    );


    /* -----------------------------------------------
       CREATE LOG SHEETS
       ----------------------------------------------- */

    const date =
      new Date();

    if (
      consumption.length > 0
    ) {

      writeConsumptionLog(
        consumption,
        sheet,
        profile,
        profile.receiptEmail,
        date
      );

    }

    if (
      purchases.length > 0
    ) {

      writePurchaseLog(
        purchases,
        sheet,
        profile,
        profile.receiptEmail,
        date
      );

    }


    /* -----------------------------------------------
       SAVE UNDO DATA
       ----------------------------------------------- */

    saveUndoData({

      timestamp:
        new Date().getTime(),

      changes:
        changes,

      consumption:
        consumption,

      purchases:
        purchases

    });


    /* -----------------------------------------------
       SEND EMAIL
       ----------------------------------------------- */

    sendInventoryReportEmail(
      sheet,
      consumption,
      purchases,
      profile,
      profile.receiptEmail,
      date
    );


    /* -----------------------------------------------
       RETURN UPDATED INVENTORY
       ----------------------------------------------- */

    SpreadsheetApp.flush();

    return {

      success:
        true,

      message:
        "Inventory report submitted successfully.",

      items:
        getInventoryItems(sheet),

      email:
        profile.receiptEmail

    };

  } finally {

    lock.releaseLock();

  }

}


/* =====================================================
   NORMALIZE INPUT
   ===================================================== */

function normalizeEntries(entries) {

  if (!entries) {
    return [];
  }

  return entries
    .map(
      function(entry) {

        return {

          rowNumber:
            Number(
              entry.rowNumber
            ),

          quantity:
            Number(
              entry.quantity
            )

        };

      }
    )
    .filter(
      function(entry) {

        return (
          Number.isInteger(
            entry.rowNumber
          ) &&

          entry.rowNumber >=
          CONFIG.DATA_START_ROW &&

          entry.quantity > 0
        );

      }
    );

}


/* =====================================================
   UNDO
   ===================================================== */

function saveUndoData(data) {

  PropertiesService
    .getUserProperties()
    .setProperty(
      "LAST_INVENTORY_ACTION",
      JSON.stringify(data)
    );

}


function undoLastReport() {

  const lock =
    LockService.getScriptLock();

  lock.waitLock(30000);

  try {

    const properties =
      PropertiesService
        .getUserProperties();

    const raw =
      properties.getProperty(
        "LAST_INVENTORY_ACTION"
      );

    if (!raw) {

      throw new Error(
        "There is no inventory submission available to undo."
      );

    }

    const data =
      JSON.parse(raw);

    const sheet =
      getMainSheet();

    validateHeaders(sheet);


    /*
     * Reverse each transaction using the exact
     * quantities stored for the last submission.
     *
     * This handles all combinations:
     *
     * - consumption only
     * - purchase only
     * - consumption + purchase
     * - multiple items
     */

    const affectedRows = {};


    data.consumption.forEach(
      function(entry) {

        const row =
          entry.rowNumber;

        if (!affectedRows[row]) {

          affectedRows[row] = {

            consumed:
              0,

            purchased:
              0

          };

        }

        affectedRows[row].consumed +=
          entry.quantity;

      }
    );


    data.purchases.forEach(
      function(entry) {

        const row =
          entry.rowNumber;

        if (!affectedRows[row]) {

          affectedRows[row] = {

            consumed:
              0,

            purchased:
              0

          };

        }

        affectedRows[row].purchased +=
          entry.quantity;

      }
    );


    Object.keys(
      affectedRows
    ).forEach(
      function(rowKey) {

        const row =
          Number(rowKey);

        const transaction =
          affectedRows[rowKey];


        let currentBought =
          toNumber(
            sheet
              .getRange(row, 4)
              .getValue()
          );

        let currentConsumed =
          toNumber(
            sheet
              .getRange(row, 5)
              .getValue()
          );

        let currentLeft =
          toNumber(
            sheet
              .getRange(row, 6)
              .getValue()
          );


        /*
         * Reverse purchases:
         *
         * Bought decreases
         * Left decreases
         */

        currentBought -=
          transaction.purchased;

        currentLeft -=
          transaction.purchased;


        /*
         * Reverse consumption:
         *
         * Consumed decreases
         * Left increases
         */

        currentConsumed -=
          transaction.consumed;

        currentLeft +=
          transaction.consumed;


        /*
         * Prevent invalid negative values.
         */

        if (
          currentBought < 0
        ) {
          currentBought = 0;
        }

        if (
          currentConsumed < 0
        ) {
          currentConsumed = 0;
        }

        if (
          currentLeft < 0
        ) {
          currentLeft = 0;
        }


        sheet
          .getRange(row, 4)
          .setValue(
            currentBought
          );

        sheet
          .getRange(row, 5)
          .setValue(
            currentConsumed
          );

        sheet
          .getRange(row, 6)
          .setValue(
            currentLeft
          );

      }
    );


    SpreadsheetApp.flush();


    /*
     * Remove only the log entries belonging
     * to this exact submission.
     */

    removeLatestLogEntries(
      data.timestamp
    );


    properties.deleteProperty(
      "LAST_INVENTORY_ACTION"
    );


    return {

      success:
        true,

      message:
        "The last inventory report has been undone.",

      items:
        getInventoryItems(sheet)

    };

  } finally {

    lock.releaseLock();

  }

}


/* =====================================================
   LOG SHEETS
   ===================================================== */

function getOrCreateSheet(
  name,
  headers
) {

  const spreadsheet =
    SpreadsheetApp
      .getActiveSpreadsheet();

  let sheet =
    spreadsheet.getSheetByName(
      name
    );

  if (!sheet) {

    sheet =
      spreadsheet.insertSheet(
        name
      );

    sheet
      .getRange(
        1,
        1,
        1,
        headers.length
      )
      .setValues([
        headers
      ]);

    sheet
      .getRange(
        1,
        1,
        1,
        headers.length
      )
      .setFontWeight(
        "bold"
      );

  }

  return sheet;
}


function writeConsumptionLog(
  entries,
  inventorySheet,
  profile,
  userEmail,
  date
) {

  const logSheet =
    getOrCreateSheet(
      CONFIG.CONSUMPTION_LOG_SHEET,
      [
        "Timestamp",
        "Date",
        "Company",
        "User",
        "Email",
        "Sr. No",
        "Item Name",
        "UOM",
        "Quantity Used"
      ]
    );


  const rows =
    entries.map(
      function(entry) {

        const row =
          entry.rowNumber;

        return [

          date,

          formatDate(date),

          profile.companyName,

          profile.userName,

          userEmail,

          inventorySheet
            .getRange(row, 1)
            .getDisplayValue(),

          inventorySheet
            .getRange(row, 2)
            .getDisplayValue(),

          inventorySheet
            .getRange(row, 3)
            .getDisplayValue(),

          entry.quantity

        ];

      }
    );


  if (
    rows.length > 0
  ) {

    logSheet
      .getRange(
        logSheet.getLastRow() + 1,
        1,
        rows.length,
        rows[0].length
      )
      .setValues(
        rows
      );

  }

}


function writePurchaseLog(
  entries,
  inventorySheet,
  profile,
  userEmail,
  date
) {

  const logSheet =
    getOrCreateSheet(
      CONFIG.PURCHASE_LOG_SHEET,
      [
        "Timestamp",
        "Date",
        "Company",
        "User",
        "Email",
        "Sr. No",
        "Item Name",
        "UOM",
        "Quantity Purchased"
      ]
    );


  const rows =
    entries.map(
      function(entry) {

        const row =
          entry.rowNumber;

        return [

          date,

          formatDate(date),

          profile.companyName,

          profile.userName,

          userEmail,

          inventorySheet
            .getRange(row, 1)
            .getDisplayValue(),

          inventorySheet
            .getRange(row, 2)
            .getDisplayValue(),

          inventorySheet
            .getRange(row, 3)
            .getDisplayValue(),

          entry.quantity

        ];

      }
    );


  if (
    rows.length > 0
  ) {

    logSheet
      .getRange(
        logSheet.getLastRow() + 1,
        1,
        rows.length,
        rows[0].length
      )
      .setValues(
        rows
      );

  }

}


/* =====================================================
   REMOVE LOG ENTRIES WHEN UNDOING
   ===================================================== */

function removeLatestLogEntries(
  timestamp
) {

  [
    CONFIG.CONSUMPTION_LOG_SHEET,
    CONFIG.PURCHASE_LOG_SHEET

  ].forEach(
    function(sheetName) {

      const spreadsheet =
        SpreadsheetApp
          .getActiveSpreadsheet();

      const sheet =
        spreadsheet.getSheetByName(
          sheetName
        );

      if (!sheet) {
        return;
      }

      const lastRow =
        sheet.getLastRow();

      if (
        lastRow < 2
      ) {

        return;

      }

      const timestamps =
        sheet
          .getRange(
            2,
            1,
            lastRow - 1,
            1
          )
          .getValues();


      /*
       * Collect matching rows first.
       * Then delete from bottom to top so
       * row numbers remain valid.
       */

      const rowsToDelete = [];

      for (
        let i = 0;
        i < timestamps.length;
        i++
      ) {

        const value =
          timestamps[i][0];

        if (
          value instanceof Date &&
          Math.abs(
            value.getTime() -
            timestamp
          ) < 5000
        ) {

          rowsToDelete.push(
            i + 2
          );

        }

      }


      for (
        let i =
          rowsToDelete.length - 1;
        i >= 0;
        i--
      ) {

        sheet.deleteRow(
          rowsToDelete[i]
        );

      }

    }
  );

}


/* =====================================================
   EMAIL REPORT
   ===================================================== */

function sendInventoryReportEmail(
  sheet,
  consumption,
  purchases,
  profile,
  receiptEmail,
  date
) {

  if (!receiptEmail) {

    throw new Error(
      "No receipt email address has been configured."
    );

  }

  if (
    !isValidEmail(receiptEmail)
  ) {

    throw new Error(
      "The configured receipt email address is invalid."
    );

  }


  const subject =
    profile.companyName +
    " - Daily Inventory Report - " +
    formatDate(date);


  let html = "";

  html +=
    "<div style='font-family:Arial,sans-serif;max-width:800px;margin:auto;'>";


  html +=
    "<h2>" +
    escapeHtml(
      profile.companyName
    ) +
    " - Daily Inventory Report" +
    "</h2>";


  html +=
    "<p><b>Date:</b> " +
    escapeHtml(
      formatDate(date)
    ) +
    "<br>" +
    "<b>Submitted by:</b> " +
    escapeHtml(
      profile.userName
    ) +
    "</p>";


  /* -----------------------------------------------
     CONSUMPTION TABLE
     ----------------------------------------------- */

  html +=
    "<h3>Items Consumed</h3>";


  if (
    consumption.length === 0
  ) {

    html +=
      "<p>No inventory was consumed today.</p>";

  } else {

    html +=
      "<table border='1' cellpadding='8' cellspacing='0' " +
      "style='border-collapse:collapse;width:100%;'>";

    html +=
      "<tr>" +
      "<th>Sr. No</th>" +
      "<th>Item</th>" +
      "<th>UOM</th>" +
      "<th>Quantity Used</th>" +
      "</tr>";


    consumption.forEach(
      function(entry) {

        const row =
          entry.rowNumber;

        html +=
          "<tr>" +

          "<td>" +
          escapeHtml(
            sheet
              .getRange(row, 1)
              .getDisplayValue()
          ) +
          "</td>" +

          "<td>" +
          escapeHtml(
            sheet
              .getRange(row, 2)
              .getDisplayValue()
          ) +
          "</td>" +

          "<td>" +
          escapeHtml(
            sheet
              .getRange(row, 3)
              .getDisplayValue()
          ) +
          "</td>" +

          "<td>" +
          entry.quantity +
          "</td>" +

          "</tr>";

      }
    );


    html += "</table>";

  }


  /* -----------------------------------------------
     PURCHASE TABLE
     ----------------------------------------------- */

  html +=
    "<h3>Items Purchased</h3>";


  if (
    purchases.length === 0
  ) {

    html +=
      "<p>No inventory was purchased today.</p>";

  } else {

    html +=
      "<table border='1' cellpadding='8' cellspacing='0' " +
      "style='border-collapse:collapse;width:100%;'>";

    html +=
      "<tr>" +
      "<th>Sr. No</th>" +
      "<th>Item</th>" +
      "<th>UOM</th>" +
      "<th>Quantity Purchased</th>" +
      "</tr>";


    purchases.forEach(
      function(entry) {

        const row =
          entry.rowNumber;

        html +=
          "<tr>" +

          "<td>" +
          escapeHtml(
            sheet
              .getRange(row, 1)
              .getDisplayValue()
          ) +
          "</td>" +

          "<td>" +
          escapeHtml(
            sheet
              .getRange(row, 2)
              .getDisplayValue()
          ) +
          "</td>" +

          "<td>" +
          escapeHtml(
            sheet
              .getRange(row, 3)
              .getDisplayValue()
          ) +
          "</td>" +

          "<td>" +
          entry.quantity +
          "</td>" +

          "</tr>";

      }
    );


    html += "</table>";

  }


  /* -----------------------------------------------
     LOW STOCK
     ----------------------------------------------- */

  const inventory =
    getInventoryItems(sheet);

  const lowStock =
    inventory.filter(
      function(item) {

        return item.lowStock;

      }
    );


  html +=
    "<h3>Current Low Stock</h3>";


  if (
    lowStock.length === 0
  ) {

    html +=
      "<p>No items are currently below their minimum threshold.</p>";

  } else {

    html +=
      "<table border='1' cellpadding='8' cellspacing='0' " +
      "style='border-collapse:collapse;width:100%;'>";

    html +=
      "<tr>" +
      "<th>Item</th>" +
      "<th>Total Left</th>" +
      "<th>Minimum Threshold</th>" +
      "</tr>";


    lowStock.forEach(
      function(item) {

        html +=
          "<tr>" +

          "<td>" +
          escapeHtml(
            item.itemName
          ) +
          "</td>" +

          "<td>" +
          item.totalLeft +
          " " +
          escapeHtml(
            item.uom
          ) +
          "</td>" +

          "<td>" +
          item.minThreshold +
          "</td>" +

          "</tr>";

      }
    );


    html += "</table>";

  }


  html +=
    "<p style='margin-top:25px;color:#666;'>" +
    "This report was generated automatically by the " +
    "Automated Inventory Control System." +
    "</p>";


  html += "</div>";


  MailApp.sendEmail({

    to:
      receiptEmail,

    subject:
      subject,

    htmlBody:
      html,

    body:
      profile.companyName +
      " - Daily Inventory Report\n\n" +

      "Date: " +
      formatDate(date) +
      "\n" +

      "Submitted by: " +
      profile.userName

  });

}


/* =====================================================
   UTILITIES
   ===================================================== */

function getCurrentUserEmail() {

  const activeUser =
    Session
      .getActiveUser()
      .getEmail();

  if (activeUser) {
    return activeUser;
  }

  const effectiveUser =
    Session
      .getEffectiveUser()
      .getEmail();

  return effectiveUser || "";

}


function formatDate(date) {

  return Utilities.formatDate(
    date,
    Session.getScriptTimeZone(),
    CONFIG.DATE_FORMAT
  );

}


function toNumber(value) {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {

    return 0;

  }

  const number =
    Number(value);

  return isNaN(number)
    ? 0
    : number;

}


function escapeHtml(value) {

  return String(
    value || ""
  )

    .replace(
      /&/g,
      "&amp;"
    )

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    )

    .replace(
      /"/g,
      "&quot;"
    )

    .replace(
      /'/g,
      "&#039;"
    );

}