Editor
===================
-------------------
The editor capability of the Virtual World Framework allows for the application to be edited in a live environment. Changes to scripts and properties within the editor are replicated across all clients in the system. 

-------------------

Opening the Editor
-------------------
-------------------
To open the editor interface, move the mouse to the upper ride side of the screen. Upon a mouse rollover, five editor tabs should be displayed. Selecting one will open the editor on the right hand side of the screen, pushing the application view to the left.

The editor consists of five tabs:

* Hierarchy
* Users
* Timeline
* Models
* About

To close the editor, rollover just to the left of the upper left corner of the editor. The five tabs will appear as well as an *X* tab. Click on the *X* tab to close the editor interface. 

-------------------

Hierarchy
-------------------
-------------------
The Hierarchy tab displays a list of all scripts, behaviors, properties, children, methods, and events in the application. In addition, this tab provides a drill down capability on selected items, allowing complete navigation of the scene structure. Some items can also be edited directly with text based inputs.

<div style='width:100%;text-align:center'><img src='images/editor_hierarchy.png' alt='hierarchy' /></div>

**Scripts**

Scripts can be both created and edited in the editor interface. 

<div style='width:100%;text-align:center'><img src='images/editor_scripts.png' alt='scripts' /></div>

*Creating New Script*

To create a new script, click on the *New Script* item listed first. Click in the text area that appears to give it focus. The editor window will expand to allow more room for typing the script. A new script can be added here that extends an existing function, for example, mouse events, or can be brand new. Once the script is ready to go, click on the *Create* button at the bottom of the editor. The script will be created on the current node of the editor. For example, if no drill downs have occurred, the script will be directly on the application. On the other hand, if the user drilled down to a child node, the script will be created directly on that child. To exit to script editor, either close the editor by selecting the *X* tab or selecting the back arrow in the upper left corner to drill back up to the node. 

*Editing Script*

To edit an existing script, click on the corresponding script listed in the editor on the appropriate node. The script editor will open, displaying the current script. Click in the text area to expand the editor working area. Make any updates as needed, and click the *Update* button at the bottom of the editor. The script will update on the current node, and will be replicated across all clients currently in the application. To exit to script editor, either close the editor by selecting the *X* tab or selecting the back arrow in the upper left corner to drill back up to the node. 

<div style='width:100%;text-align:center'><img src='images/editor_script.png' alt='script' /></div>

**Behaviors**

Behaviors can be attached to any node in the scene. For all nodes with behaviors, upon drilling into the selected node, a list of all implemented behaviors will be displayed. 

<div style='width:100%;text-align:center'><img src='images/editor_behavior.png' alt='behavior' /></div>

**Properties**

All properties of a given node can be edited while the application is running. Using the editor interface, drill down into the appropriate node, or find the property in the application's property list. The property value can simply be edited by entering or changing the value and clicking the *Enter* key.

<div style='width:100%;text-align:center'><img src='images/editor_properties.png' alt='properties' /></div>

Numerical and boolean properties as well as values of null and undefined can be entered as is directly in the text box. String based values can be entered with quotations, and arrays can be entered directly in the form of *[ 0, 0, 0 ]*.

**Children**

All children of the current node are listed in the editor, and each can be drilled into to see a level deeper in the tree structure. Each child node is marked with a white arrow to the right of the child's name. Click on any child in the list in order to drill down. The new node information will be displayed including any scripts, behaviors, properties, children, methods, and events associated with the node. 

<div style='width:100%;text-align:center'><img src='images/editor_children.png' alt='children' /></div>

**Methods**

All methods associated with the current node are listed in the editor. They can be called directly from the main window, or drilled into to set specific parameters. Clicking the *Call* button will call the method directly. If the mouse rolls over just to the right of the button, a white arrow will appear. Clicking the white arrow will drill down into the method. Here parameters can be specified in the given text fields. The *Call* button can then be clicked from the header. To go back to the node, select the white back arrow in the upper left corner. 

<div style='width:100%;text-align:center'>
<img src='images/editor_method.png' alt='method' />
<img src='images/editor_method_2.png' alt='method' />
</div>

**Events**

All events associated with the current node are listed in the editor. They can be fired directly from the main window, or drilled into to set specific parameters. Clicking the *Fire* button will fire the method directly. If the mouse rolls over just to the right of the button, a white arrow will appear. Clicking the white arrow will drill down into the event. Here parameters can be specified in the given text fields. The *Fire* button can then be clicked from the header. To go back to the node, select the white back arrow in the upper left corner. 

<div style='width:100%;text-align:center'>
<img src='images/editor_event.png' alt='event' />
<img src='images/editor_event_2.png' alt='event' />
</div>

-------------------

Users
-------------------
-------------------
The Users tab shows a list of all user IDs currently in the application instance.

<div style='width:100%;text-align:center'><img src='images/editor_users.png' alt='users' /></div>

-------------------

Timeline
-------------------
-------------------
The Timeline tab contains a pause and stop button which, when pressed, will pause and stop the application clock, respectively. In this case, the pause button will change to a play button which will allow the clock to be started again. Additionally, the Timeline tab also allows the clock speed to be adjusted to be faster or slower, depending on where the slider is dragged. The rate will be numerically displayed below in relation to the normal time.

<div style='width:100%;text-align:center'><img src='images/editor_timeline.png' alt='timeline' /></div>

-------------------

Models
-------------------
-------------------
The Models tab allows for the creation of new children in the scene. Upon opening the tab, a list of all available models on the server is displayed. Clicking on any of the listed models will drill down into that model, allowing the user to set some initial properties, including the rotation, scale, and translation offset(distance from the drop location). After setting these properties, the user can then drag the *Drag to Create* area and drop it on any location in the scene. Upon the drop, the new object will be created with the specified properties. 

<div style='width:100%;text-align:center'>
<img src='images/editor_models.png' alt='models' />
<img src='images/editor_models_2.png' alt='models' />
</div>

-------------------

About
-------------------
-------------------
The About tab displays the current version of the Virtual World Framework used in the application, where the first number describes a major release, the second a minor release, the third a patch, and finally, the revision number of the build. The tab also contains links to the main webpage and github repository for user reference.

<div style='width:100%;text-align:center'><img src='images/editor_about.png' alt='about' /></div>

-------------------

