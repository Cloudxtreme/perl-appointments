# perl-appointments
A small web app made using PERL that allows for scheduling appointments


Host this site on the root of your Apache server running at http://localhost/ and navigate to http://localhost/appointments.cgi 

# Limitations:
Given the nature and scope of this project, a few things were not fleshed out entirely.
* Browser support :  The app assumes the user has the HTML5 date and time-pickers.
* No Framework : Ordinarily I would develop this with a JavaScript framework, but the instructions seemed to want just jQuery. 
* Private variables : If other components were going to be introduced and interacting with the App instance, most of it would've been made private, only exposing the APIs necessary to make changes. 
