var express        = require("express"),
    app            = express(),
    bodyParser     = require("body-parser"),
    methodOverride = require("method-override"),
    au             = require("ansi_up"),
    {spawnSync}    = require("child_process"),
    fs             = require("fs");

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(methodOverride("_method"));

var ansi_up     = new au.default; // WRENCH produces output to the terminal using ansi colors, ansi_up will apply those colors to <span> html elements

// default route that displays the page with no data and only a form to be filled
app.get("/activity_1", function(req, res) {
    res.render("activity_1", {workflow_graph_json: JSON.parse(fs.readFileSync(__dirname + "/../activity_1_getting_started/workflow_graph.json")),
                                cyber_infrastructure_svg: fs.readFileSync(__dirname + "/public/img/activity_1_cyber_infrastructure.svg")});
});

app.post("/run/activity_1", function(req, res) {

    const PATH_PREFIX = __dirname.replace("visualization", "activity_1_getting_started/");
    
    const EXECUTABLE             = PATH_PREFIX + (req.body.simulator_number == 1 ? "simulator_remote_storage" : "simulator_local_storage");
    const LINK_BANDWIDTH         = req.body.link_bandwidth;

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

app.get("/activity_2", function(req, res) {
   res.render("activity_2", {
       workflow_graph_json: JSON.parse(fs.readFileSync(__dirname + "/../activity_2_parallelism/workflow_graph.json")),
       cyber_infrastructure_svg: fs.readFileSync(__dirname + "/public/img/activity_2_cyber_infrastructure.svg")
   });
});

app.post("/run/activity_2", function(req, res) {

    const PATH_PREFIX = __dirname.replace("visualization", "activity_2_parallelism/");

    const EXECUTABLE             = PATH_PREFIX + "activity_2_simulator";

    const NUM_NODES = req.body.num_nodes;
    const NUM_CORES_PER_NODE = req.body.num_cores_per_node;
    const NUM_TASKS_TO_JOIN = 20;
    const FILE_SIZE = 100000000;
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
            "workflow_graph_json": JSON.parse(fs.readFileSync(__dirname + "/workflow_graph.json"))
        });
    }
});

app.listen(3000, function() {
    console.log("Visualization server is running!");
});
