#!/usr/bin/env perl
use strict;
use warnings;
use Text::Markdown qw(markdown);

=head1 NAME

Markdown.pl - Convert Markdown syntax to (X)HTML

=head1 DESCRIPTION

This program is distributed as part of Perl's Text::Markdown module,
illustrating sample usage.

Markdown can be invoked on any file containing Markdown-syntax, and
will produce the corresponding (X)HTML on STDOUT:

    $ cat file.txt
    This is a *test*.

    Absolutely _nothing_ to see here. _Just a **test**_!

    * test
    * Yup, test.
    $ Markdown.pl file.txt
    <p>This is a <em>test</em>.</p>

    <p>Absolutely <em>nothing</em> to see here. <em>Just a <strong>test</strong></em>!</p>

    <ul>
    <li>test</li>
    <li>Yup, test.</li>
    </ul>

If no file is specified, it will expect its input from STDIN:

    $ echo "A **simple** test" | markdown
    <p>A <strong>simple</strong> test</p>

=head1 OPTIONS

=over

=item version

Shows the full information for this version

=item shortversion

Shows only the version number

=item html4tags

Produce HTML 4-style tags instead of XHTML - XHTML requires elements
that do not wrap a block (i.e. the C<hr> tag) to state they will not
be closed, by closing with C</E<gt>>. HTML 4-style will plainly output
the tag as it comes:

    $ echo '---' | markdown
    <hr />
    $ echo '---' | markdown --html4tags
    <hr>

=item help

Shows this documentation

=back

=head1 AUTHOR

Copyright 2004 John Gruber

Copyright 2008 Tomas Doran

The manpage was written by Gunnar Wolf <gwolf@debian.org> for its use
in Debian systems, but can be freely used elsewhere.

For full licensing information, please refer to
L<Text::Markdown.pm>'s full documentation.

=head1 SEE ALSO

L<Text::Markdown>, L<http://daringfireball.net/projects/markdown/>

=cut

#### Check for command-line switches: #################
my %cli_opts;
use Getopt::Long;
Getopt::Long::Configure('pass_through');
GetOptions(\%cli_opts,
    'version',
    'shortversion',
    'html4tags',
    'help',
);
if ($cli_opts{'version'}) {     # Version info
    print "\nThis is Markdown, version $Text::Markdown::VERSION.\n";
    print "Copyright 2004 John Gruber\n";
    print "Copyright 2008 Tomas Doran\n";
    print "Parts contributed by several other people.";
    print "http://daringfireball.net/projects/markdown/\n\n";
    exit 0;
}
if ($cli_opts{'shortversion'}) {        # Just the version number string.
    print $Text::Markdown::VERSION;
    exit 0;
}
if ($cli_opts{'help'}) {
    for my $dir (split m/:/, $ENV{PATH}) {
	my $cmd = "$dir/perldoc";
	exec($cmd, $0) if (-f $cmd and -x $cmd);
    }
    die "perldoc could not be found in your path - Cannot show help, sorry\n";
}
my $m;
if ($cli_opts{'html4tags'}) {           # Use HTML tag style instead of XHTML
    $m = Text::Markdown->new(empty_element_suffix => '>');
}
else {
    $m = Text::Markdown->new;
}

sub main {
    my (@fns) = @_;
    
    my $f;
    if (scalar @fns) {
        foreach my $fn (@fns) {
            die("Cannot find file $fn") unless (-r $fn);

            my $fh;
            open($fh, '<', $fn) or die;
            $f = join('', <$fh>);
            close($fh) or die;
        }
    }
    else { # STDIN
        local $/;               # Slurp the whole file
        $f = <>;
    }
    
    return $m->markdown($f);
}

print main(@ARGV) unless caller();
