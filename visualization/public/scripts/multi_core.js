

$(function() {



    // Update the label that says how many cores each compute node has
    $("#num-cores").on("keyup", function() {
        let num_cores_input_el = $(this);
        let num_cores_input_value = parseInt(num_cores_input_el.val());
        let num_cores_label_el = $(".num-cores-label");

        if (num_cores_input_value >= 1 && num_cores_input_value <= 32) {

            num_cores_label_el.text("Cores: " + num_cores_input_value)
                .css("background-color", "#d3ffe9");

            num_cores_input_el.removeClass("is-invalid")
                .addClass("is-valid");

            setTimeout(function() {
                if (num_cores_label_el.css("background-color") == "rgb(211, 255, 233)") {
                    num_cores_label_el.css("background-color", "");
                }
            }, 500);
        } else {
            num_cores_label_el.css("background-color", "#ffb7b5");
            num_cores_input_el.removeClass("is-valid")
                .addClass("is-invalid");
        }
    });

    // Update the label that says how many tasks will be run
    $("#num-tasks").on("keyup", function() {
        let num_tasks_input_el = $(this);
        let num_tasks_input_value = parseInt(num_tasks_input_el.val());
        let num_tasks_label_el = $(".num-tasks-label");

        if (num_tasks_input_value >= 1 && num_tasks_input_value <1000) {

            num_tasks_label_el.text(num_tasks_input_value + " Task(s)")
                .css("background-color", "#d3ffe9");

            num_tasks_input_el.removeClass("is-invalid")
                .addClass("is-valid");

            setTimeout(function() {
                if (num_tasks_label_el.css("background-color") == "rgb(211, 255, 233)") {
                    num_tasks_label_el.css("background-color", "");
                }
            }, 500);
        } else {
            num_tasks_label_el.css("background-color", "#ffb7b5");
            num_tasks_input_el.removeClass("is-valid")
                .addClass("is-invalid");
        }
    });

    // Update the label that says how much RAM is used by each task
    $("#task-ram").on("keyup", function() {
        let task_ram_input_el = $(this);
        let task_ram_input_value = parseInt(task_ram_input_el.val());
        let task_ram_label_el = $(".ram-label");

        if (task_ram_input_value >= 0 && task_ram_input_value<=32) {

            task_ram_label_el.text(task_ram_input_value + "GB")
                .css("background-color", "#d3ffe9");

            task_ram_input_el.removeClass("is-invalid")
                .addClass("is-valid");

            setTimeout(function() {
                if (task_ram_label_el.css("background-color") == "rgb(211, 255, 233)") {
                    task_ram_label_el.css("background-color", "");
                }
            }, 500);
        } else {
            task_ram_label_el.css("background-color", "#ffb7b5");
            task_ram_input_el.removeClass("is-valid")
                .addClass("is-invalid");
        }
    });

    $('#simulator-form').on('submit', function(event) {
        // we don't want the page reloading, so things look dynamic (this will be nice when we use d3's transitions)
        event.preventDefault();
        disableRunSimulationButton();

        $('.chart').css('display', 'block');

        // remove the graphs, since we will append a new ones to the chart
        $('.chart > svg').remove();

        // Upon submission of the form, a POST request containing the user's desired parameters
        // is sent to the node server, where the simulation will be executed with those parameters.
        // Then a response with simulation data is received. The data is parsed, and rendered on the
        // screen. 
        $.ajax({
            url: '/run/multi_core',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(
                {
                    num_cores: $("#num-cores").val(),
                    num_tasks: $("#num-tasks").val(),
                    task_gflop: 100,
                    task_ram: $("#task-ram").val()
                }),

                success: function(response) {

                    // Add the new simulation output into the "Simulation Output" section
                    $("#simulation-output").empty()
                        .append(response.simulation_output);

                    generate_host_utilization_graph_given_cores(response.task_data, $("#num-cores").val());

                    generate_workflow_execution_graph(response.task_data);

                    populateWorkflowTaskDataTable(response.task_data);
                }
        });
    });
});
