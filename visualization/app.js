const express        = require("express"),
      app            = express(),
      bodyParser     = require("body-parser"),
      methodOverride = require("method-override"),
      au             = require("ansi_up"),
      {spawnSync}    = require("child_process"),
      fs             = require("fs"),
      passport       = require("passport"),
      passportSetup  = require("./passport-setup")
      cookieSession  = require("cookie-session"),
      request        = require("request"),
      flash          = require("connect-flash"),
      keys           = require("./keys.js");

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(methodOverride("_method"));
app.use(flash());

app.use(cookieSession({
  maxAge: 24 * 60 * 60 * 1000, // a day in milliseconds
  keys: [keys.cookieSession.key]
}));
app.use(passport.initialize());
app.use(passport.session());

// check if authenticated
const authCheck = function(req, res, next) {
  if (!req.user) {
    // if user not already logged in, redirect them to the
    // homepage where they can log in
    res.redirect("/");
  } else {
    // the user is logged in so move on to the next middleware
    next()
  }
}

// WRENCH produces output to the terminal using ansi colors, ansi_up will apply those colors to <span> html elements
var ansi_up = new au.default;

// main route that will show login/logout and available activities
app.get("/", function(req, res) {
  res.render("index", {user: req.user,
                        messages: req.flash("error")});
});

// login through google
app.get("/google", passport.authenticate("google", {
  scope: ["email"]
}));

// callback route for google to redirect to
app.get("/google/redirect", passport.authenticate("google", {
    successRedirect: "/",
    failureRedirect: "/",
    failureFlash: true
}));

// logout route
app.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/");
});

// display activity 1 visualization route
app.get("/activity_1", authCheck, function(req, res) {
    res.render("activity_1", {workflow_graph_json: JSON.parse(fs.readFileSync(__dirname + "/../activity_1_getting_started/workflow_graph.json")),
                                cyber_infrastructure_svg: fs.readFileSync(__dirname + "/public/img/activity_1_cyber_infrastructure.svg")});
});

// execute activity 1 simulation route
app.post("/run/activity_1", authCheck, function(req, res) {
    const PATH_PREFIX = __dirname.replace("visualization", "activity_1_getting_started/");

    const SIMULATOR = (req.body.simulator_number == 1 ? "simulator_remote_storage" : "simulator_local_storage");
    const EXECUTABLE = PATH_PREFIX + SIMULATOR;
    const LINK_BANDWIDTH = req.body.link_bandwidth;

    // additional WRENCH arguments that filter simulation output (We only want simulation output from the WMS in this activity)
    const LOGGING = [
        "--log=root.thresh:critical",
        "--log=wms.thresh:debug",
        "--log=simple_wms.thresh:debug",
        "--log=simple_wms_scheduler.thresh:debug",
        "--log='root.fmt:[%d][%h:%t]%e%m%n'"
    ];

    const SIMULATION_ARGS = [LINK_BANDWIDTH].concat(LOGGING);
    const RUN_SIMULATION_COMMAND = [EXECUTABLE].concat(SIMULATION_ARGS).join(" ");

    console.log("\nRunning Simulation");
    console.log("===================");
    console.log("Executing command: " + RUN_SIMULATION_COMMAND);
    var simulation_process = spawnSync(EXECUTABLE, SIMULATION_ARGS);

    if (simulation_process.status != 0) {
      console.log("Something went wrong with the simulation. Possibly check arguments.");
      console.log(simulation_process.stderr.toString());
    } else {
      var simulation_output = simulation_process.stderr.toString();
      console.log(simulation_output);

      /**
       * Log the user running this simulation along with the
       * simulation parameters to the data server.
       */
      request({
          method: "POST",
          uri: keys.dataServer.uri,
          json: {
            "key": keys.dataServer.key,
            "data": {
              "user": req.user,
              "time": Math.round(new Date().getTime() / 1000),  // unix timestamp
              "activity": 1,
              "simulator": SIMULATOR,
              "link_bandwidth": LINK_BANDWIDTH
            }
          }
        },
         function(error, response, body) {
           if (!error && response.statusCode == 201) {
             console.log("sent POST request to data_server @ localhost:3001");
           } else {
             console.log(error);
           }
         }
      );

      /**
       * The simulation output uses ansi colors and we want these colors to show up in the browser as well.
       * Ansi up will take each line, make it into a <span> element, and edit the style so that the text color
       * is whatever the ansi color was. Then the regular expression just adds in <br> elements so that
       * each line of output renders on a separate line in the browser.
       *
       * The simulation output and the workflowtask data are sent back to the client (see public/activity_1.js)
       */
      var find = "</span>";
      var re = new RegExp(find, "g");

      res.json({
          "simulation_output": ansi_up.ansi_to_html(simulation_output).replace(re, "<br>" + find),
          "task_data": JSON.parse(fs.readFileSync(__dirname + "/workflow_data.json"))
      });


    }
});

// display activity 2 visualization route
app.get("/activity_2", authCheck, function(req, res) {
   res.render("activity_2", {
       cyber_infrastructure_svg: fs.readFileSync(__dirname + "/public/img/activity_2_cyber_infrastructure.svg")
   });
});

// execute activity 2 simulation route
app.post("/run/activity_2", authCheck, function(req, res) {
    const PATH_PREFIX = __dirname.replace("visualization", "activity_2_parallelism/");

    const SIMULATOR = "activity_2_simulator";
    const EXECUTABLE = PATH_PREFIX + SIMULATOR;

    const NUM_NODES = req.body.num_nodes;
    const NUM_CORES_PER_NODE = req.body.num_cores_per_node;
    const NUM_TASKS_TO_JOIN = 20;
    const FILE_SIZE = 2000000000;
    const RAM_REQUIRED = (req.body.ram_required == 1) ? "RAM_REQUIRED" : "RAM_NOT_REQUIRED";

    // additional WRENCH arguments that filter simulation output (We only want simulation output from the WMS in this activity)
    const LOGGING = [
        "--log=root.thresh:critical",
        "--log=wms.thresh:debug",
        "--log=simple_wms.thresh:debug",
        "--log=simple_wms_scheduler.thresh:debug",
        "--log='root.fmt:[%d][%h:%t]%e%m%n'"
    ];

    const SIMULATION_ARGS = [NUM_NODES, NUM_CORES_PER_NODE, NUM_TASKS_TO_JOIN, FILE_SIZE, RAM_REQUIRED].concat(LOGGING);
    const RUN_SIMULATION_COMMAND = [EXECUTABLE].concat(SIMULATION_ARGS).join(" ");

    console.log("\nRunning Simulation");
    console.log("===================");
    console.log("Executing command: " + RUN_SIMULATION_COMMAND);
    var simulation_process = spawnSync(EXECUTABLE, SIMULATION_ARGS);

    if (simulation_process.status != 0) {
        console.log("Something went wrong with the simulation. Possibly check arguments.");
        console.log(simulation_process.stderr.toString());
    } else {
        var simulation_output = simulation_process.stderr.toString();
        console.log(simulation_output);

        /**
         * Log the user running this simulation along with the
         * simulation parameters to the data server.
         */
        request({
            method: "POST",
            uri: keys.dataServer.uri,
            json: {
              "key": keys.dataServer.key,
              "data": {
                "user": req.user,
                "time": Math.round(new Date().getTime() / 1000),  // unix timestamp
                "activity": 2,
                "num_nodes": NUM_NODES,
                "num_cores_per_node": NUM_CORES_PER_NODE,
                "num_tasks_to_join": NUM_TASKS_TO_JOIN,
                "file_size": FILE_SIZE,
                "ram_required": RAM_REQUIRED
              }
            }
          },
           function(error, response, body) {
             if (response.statusCode == 201) {
               console.log("made POST request to data_server @ localhost:3001");
             } else {
               console.log("error: " + response.statusCode);
               console.log(body);
             }
           }
        );

        /**
         * The simulation output uses ansi colors and we want these colors to show up in the browser as well.
         * Ansi up will take each line, make it into a <span> element, and edit the style so that the text color
         * is whatever the ansi color was. Then the regular expression just adds in <br> elements so that
         * each line of output renders on a separate line in the browser.
         *
         * The simulation output and the workflowtask data are sent back to the client (see public/activity_1.js)
         */
        var find = "</span>";
        var re = new RegExp(find, "g");

        res.json({
            "simulation_output": ansi_up.ansi_to_html(simulation_output).replace(re, "<br>" + find),
            "task_data": JSON.parse(fs.readFileSync(__dirname + "/workflow_data.json")),
        });
    }
});

app.listen(3000, function() {
    console.log("Visualization server is running on port 3000");
});
