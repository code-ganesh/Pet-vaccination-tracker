const schedule = require("node-schedule");
const nodemailer = require("nodemailer");
const db = require("./db"); // Import your existing database connection

// Email Transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "petcarepawpal@gmail.com",
    pass: "kstr xkau kyvy vxha", // Your app password here
  },
});

// Scheduler to Check Vaccination Due Dates
schedule.scheduleJob("22 16 * * *", () => {
  console.log("Checking for overdue vaccinations...");

  const query = `
    SELECT O.Email,O.Name AS OwnerName,P.Name, pv.PetID, pv.VaccineID, pv.DueDate
    FROM PetVaccination pv, Pet P, Owner O
    WHERE pv.PetID = P.PetID AND P.OwnerID = O.OwnerID
    AND pv.DueDate <= CURDATE() AND pv.Status = 'Pending';
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching overdue vaccinations:", err);
      return;
    }

    results.forEach((record) => {
      const mailOptions = {
        from: "petcarepawpal@gmail.com",
        to: record.Email,
        subject: `Vaccination Reminder for Pet ID: ${record.PetID}`,
        text: `Dear ${record.OwnerName},

Your pet ${record.Name} with ID ${record.PetID} is due for a vaccination. Please visit the clinic as soon as possible.

Vaccine ID: ${record.VaccineID}
Due Date: ${record.DueDate}

Thank you,
PawPal`,
      };

      transporter.sendMail(mailOptions, (emailErr, info) => {
        if (emailErr) {
          console.error('Error sending email to:', record.Email, emailErr);
        } else {
          console.log(`Email sent successfully to ${record.Email}: ${info.response}`);
        }
      });
    });
  });
});
