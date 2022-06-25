const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const app = express();
const bodyParser = require("body-parser");
const { query } = require("express");
app.use(bodyParser.json());
const PORT = process.env.PORT || 5000;
app.use(cors());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});
app.get("/hotels", (req, res) => {
  pool
    .query("SELECT * FROM hotels")
    .then((result) => res.json(result.rows))
    .catch((er) => {
      console.error(er);
      res.status(500).json(er);
    });
});
app.post("/hotels", (req, res) => {
  // if (req.body && req.body.roomNumber > 0 && req.body.hotelname.length > 0) {
  //   const prohabitat = [
  //     "union",
  //     "delete",
  //     "remove",
  //     "drop",
  //     "update",
  //     "alter",
  //     "select",
  //     "insert",
  //   ];
  const roomNumber = req.body.roomNumber;
  const hotelName = req.body.hotelName;
  const postcode = req.body.postcode;
  console.log(roomNumber, hotelName, postcode);
  // prohabitat.forEach((word) => {
  //   if (hotelName.includes(word)) {
  //     return res.status(400).send("Bad request :(");
  //   }
  // });
  pool
    .query("SELECT * FROM hotels WHERE name = $1", [hotelName])
    .then((result) => {
      if (result.rows.length > 0) {
        return res.status(400).send("Try to choose another name for the hotel");
      } else {
        const query =
          "INSERT INTO hotels (name, rooms, postcode) VALUES ($1, $2, $3)";
        pool
          .query(query, [hotelName, roomNumber, postcode])
          .then(() => res.send("Hotel created"))
          .catch((er) => {
            console.log(er);
            res.status(500).json(er);
          });
      }
    });
  // } else {
  //   return res.status(400).send("Sorry, Bad request :(");
  // }
});
app.get("/hotels/:hotelId", (req, res) => {
  const hotelId = req.params.hotelId;
  console.log(hotelId);
  if (hotelId > 0) {
    const query = "SELECT * FROM hotels WHERE id = $1";
    pool
      .query(query, [hotelId])
      .then((result) => res.status(200).json(result.rows));
  } else {
    return res.status(404).send("Nothing found ! :(");
  }
});
app.get("/customers", (req, res) => {
  const query = "SELECT * FROM customers ORDER BY name";
  pool
    .query(query)
    .then((result) => res.status(200).json(result.rows))
    .catch((er) => {
      console.log(er);
      res.status(404).send("error from server");
    });
});
app.get("/customers/:customerId", (req, res) => {
  const found = req.params.customerId;
  if (found) {
    const query = "SELECT * FROM customers WHERE id = $1";
    pool
      .query(query, [found])
      .then((result) => res.status(200).json(result.rows))
      .catch((er) => {
        console.log(er);
        res.status(500).send("Internal error :(");
      });
  } else {
    res.status(404).send("nothing found :(");
  }
});
app.get("/customers/:customerId/bookings", (req, res) => {
  const found = req.params.customerId;
  if (found) {
    const query =
      "SELECT customers.name, bookings.checkin_date, bookings.nights FROM customers INNER JOIN bookings ON customers.id = bookings.customer_id WHERE customers.id = $1";
    pool
      .query(query, [found])
      .then((result) => res.status(200).json(result.rows))
      .catch((er) => {
        res.status(404).send("Nothing found ! :(");
      });
  } else {
    res.status(500).send("Enternal error! :(");
  }
});
app.put("/customers/:customerId", (req, res) => {
  const found = req.params.customerId;
  const newEmail = req.body.email;
  if (!newEmail.includes("@yahoo.com")) {
    res.status(400).send("Please enter an valid email address!");
  }
  if (found) {
    const query = "UPDATE customers SET email = $1 WHERE id = $2";
    pool
      .query(query, [newEmail, found])
      .then(() => res.status(200).send("Customer edited successfully!"))
      .catch((er) => {
        console.log(er);
        res.end();
      });
  } else {
    res.status(404).send("Nothing found! :(");
  }
});
app.delete("/customers/:customerId", (req, res) => {
  const found = req.params.customerId;
  const removeCustomer = "DELETE FROM customers WHERE id = $1";
  const removeBooking = "DELETE FROM bookings WHERE customer_id = $1 ";

  pool
    .query(removeBooking, [found])
    .then((result) => {
      pool
        .query(removeCustomer, [found])
        .then(res.status(200).send("customer deleted with all the bookings!"))
        .catch((er) => {
          console.log(er);
          res.status(400).send("Couldn't Remove the customer whith bookings");
        });
    })
    .catch((er) => {
      console.log(er);
      res.status(400).send("Couldn't Remove the customer whith bookings");
    });
});
app.listen(PORT, () => {
  console.log(`App is running on ${PORT}`);
});
