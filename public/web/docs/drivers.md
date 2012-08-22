Drivers
===================
-------------------
Coming soon!

-------------------

<!-- **How Drivers Connect to the Kernel** -->

<!-- The kernel has a list of drivers that stand side by side. It is setup so that there is a pipeline between the kernel and the drivers that setup the stages by performing things such as logging or translation between the kernel IDs and the object references. Drivers that don't care about the prototype relationship, can remove this information (ie glge can think about only a tree without thinking about the prototypes that make it up.) -->

<!-- KERNEL -> PIPELINE STAGES (ability to transform messages going across, currently only supported by the models) -> DRIVER / Check out redmine wiki article called 'Declaring a driver with pipeline stages' -->

<!-- Notes: Draw barrier between the view and the model? / User modules can be added or removed from the application (eventually will be loaded dynamically depending on what the application needs to function properly.) -->

