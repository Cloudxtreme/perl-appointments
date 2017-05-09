#!perl
use CGI qw(:standard);
use DBI;
use JSON;
use Scalar::Util qw(looks_like_number);
use strict;
use warnings;

my $dbfile = 'Appointments.db';
my $dbh = DBI->connect("dbi:SQLite:dbname=$dbfile","","", { RaiseError => 1 })
                      or die $DBI::errstr;
my $cgi = new CGI;

# if request method is GET, redirect to page or query database
if ($ENV{REQUEST_METHOD} eq 'GET'){
	my $query = param('query');
	# if no query parameter, display page
	if (!defined $query){
		print $cgi->redirect('http://localhost/index.html');
	}else{
		print "Content-type: text/json\n\n";
		my $sth = $dbh->prepare(q{
			SELECT * FROM Appointments WHERE Appointment_Description LIKE ? ORDER BY Appointment_Epoch ASC;
		});
		my $rv = $sth->execute('%' . $query . '%') or die $DBI::errstr;
		if($rv < 0){
		   # print $DBI::errstr;
		   print 'An error has occurred'
		}
		my @data;
		# build json from results
		while(my @row = $sth->fetchrow_array()) {
			my $json = {};
		    $json->{'appointmentId'} = $row[0];
		    $json->{'appointmentEpoch'} = $row[1];
		    $json->{'appointmentDescription'} = $row[2];
		    push @data, $json;
		}
		print JSON::to_json(\@data);
	}
}elsif ($ENV{REQUEST_METHOD} eq 'POST'){
	my $epoch = param('epoch');
	my $description = param('description');
	my $time = param('time');
	my $date = param('date');
	# check that epoch is a number
	if (!looks_like_number($epoch)) {
		print $cgi->redirect("http://localhost/index.html?error=Invalid date value&date=$date&time=$time&description=$description");
	}
	# check that epoch is in the future
	elsif ($epoch < (time() * 1000) ){
		print $cgi->redirect("http://localhost/index.html?error=Invalid date value. Please schedule appointment for the future&date=$date&time=$time&description=$description");
	}
	# check that a description was provided
	elsif (length($description) == 0){
		print $cgi->redirect("http://localhost/index.html?error=Please provide a description&date=$date&time=$time&description=$description");
	}else{
		my $sth = $dbh->prepare(q{
			INSERT INTO Appointments (Appointment_Epoch, Appointment_Description) VALUES(?, ?)
		});
		my $rv = $sth->execute($epoch, $description) or die $DBI::errstr;
		if($rv < 0){
			print $cgi->redirect("http://localhost/index.html?error=An error occured when attempting to save the appointment&date=$date&time=$time&description=$description");
		}else{
			print $cgi->redirect('http://localhost/index.html');
		}
	}
		
}
	
$dbh->disconnect()
