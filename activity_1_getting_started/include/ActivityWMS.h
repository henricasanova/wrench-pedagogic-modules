#ifndef ACTIVITY_WMS_H
#define ACTIVITY_WMS_H

#include <wrench-dev.h>

namespace wrench {

    class Simulation;

    class ActivityWMS : public WMS {
    public:
        ActivityWMS(std::unique_ptr <StandardJobScheduler> standard_job_scheduler,
                    std::unique_ptr <PilotJobScheduler> pilot_job_scheduler,
                    const std::set<ComputeService *> &compute_services,
                    const std::set<StorageService *> &storage_services,
                    const std::string &hostname);

        void processEventStandardJobCompletion(std::unique_ptr<wrench::StandardJobCompletedEvent>);

    private:
        int main() override;

        std::shared_ptr<JobManager> job_manager;
        bool abort = false;

    };
};

#endif