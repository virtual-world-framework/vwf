module.exports = manifest;

/// Return a list of applications available to launch, instances to connect to, and documents to
/// load.

function manifest() {

  return [

    {
      name:
        "scenario-with-document-without-instance",
      document: {
        uri: "/TDG/load/scenario-with-document-without-instance",
        timestamp: +new Date( "2015-01-01T01:00:00-0500" ) },
      state: {
        title: "Scenario with document without instance" },
    },

    {
      name:
        "scenario-without-document-with-instance",
      instance:
        "/TDG/0123456789ABCDEF",
      state: {
        title: "Scenario without document with instance" },
    },

    {
      name:
        "scenario-with-document-with-instance",
      document: {
        uri: "/TDG/load/scenario-with-document-with-instance",
        timestamp: +new Date( "2015-01-01T03:00:00-0500" ) },
      instance:
        "/TDG/0123456789ABCDEF",
      state: {
        title: "Scenario with document with instance" },
    },

    {
      name:
        "scenario-without-sessions",
      document: {
        uri: "/TDG/load/scenario-without-sessions",
        timestamp: +new Date( "2015-01-01T04:00:00-0500" ) },
      state: {
        title: "Scenario without sessions" },
    },

    {
      name:
        "scenario-with-session-with-document-without-instance",
      document: {
        uri: "/TDG/load/scenario-with-session-with-document-without-instance",
        timestamp: +new Date( "2015-01-01T05:00:00-0500" ) },
      state: {
        title: "Scenario with session with document without instance" },
      sessions: [ {
        name:
          "session1",
        document: {
          uri: "/TDG/load/scenario-with-session-with-document-without-instance+session1",
          timestamp: +new Date( "2015-02-01T00:00:00-0500" ) },
        state: {
          title: "Scenario with session with document without instance",
          classroom: { company: "Company", platoon: "1", unit: "1" },
        }
      } ]
    },

    {
      name:
        "scenario-with-session-without-document-with-instance",
      document: {
        uri: "/TDG/load/scenario-with-session-without-document-with-instance",
        timestamp: +new Date( "2015-01-01T06:00:00-0500" ) },
      state: {
        title: "Scenario with session without document with instance" },
      sessions: [ {
        name:
          "session1",
        instance:
          "/TDG/0123456789ABCDEF",
        state: {
          title: "Scenario with session without document with instance",
          classroom: { company: "Company", platoon: "1", unit: "1" },
        }
      } ]
    },

    {
      name:
        "scenario-with-session-with-document-with-instance",
      document: {
        uri: "/TDG/load/scenario-with-session-with-document-with-instance",
        timestamp: +new Date( "2015-01-01T07:00:00-0500" ) },
      state: {
        title: "Scenario with session with document with instance" },
      sessions: [ {
        name:
          "session1",
        document: {
          uri: "/TDG/load/scenario-with-session-with-document-with-instance+session1",
          timestamp: +new Date( "2015-02-01T00:00:00-0500" ) },
        instance:
          "/TDG/0123456789ABCDEF",
        state: {
          title: "Scenario with session with document with instance",
          classroom: { company: "Company", platoon: "1", unit: "1" },
        }
      } ]
    },

    {
      name:
        "scenario-with-multiple-sessions",
      document: {
        uri: "/TDG/load/scenario-with-multiple-sessions",
        timestamp: +new Date( "2015-01-01T08:00:00-0500" ) },
      state: {
        title: "Scenario with multiple sessions" },
      sessions: [ {
        name:
          "session1",
        document: {
          uri: "/TDG/load/scenario-with-multiple-sessions+session1",
          timestamp: +new Date( "2015-02-01T00:00:00-0500" ) },
        instance:
          "/TDG/0123456789ABCDEF",
        state: {
          title: "Scenario with multiple sessions",
          classroom: { company: "Company", platoon: "1", unit: "1" },
        }
      }, {
        name:
          "session2",
        document: {
          uri: "/TDG/load/scenario-with-multiple-sessions+session2",
          timestamp: +new Date( "2015-02-02T00:00:00-0500" ) },
        instance:
          "/TDG/0123456789ABCDEF",
        state: {
          title: "Scenario with multiple sessions",
          classroom: { company: "Company", platoon: "1", unit: "1" },
        }
      }, {
        name:
          "session3",
        document: {
          uri: "/TDG/load/scenario-with-multiple-sessions+session3",
          timestamp: +new Date( "2015-02-03T00:00:00-0500" ) },
        instance:
          "/TDG/0123456789ABCDEF",
        state: {
          title: "Scenario with multiple sessions",
          classroom: { company: "Company", platoon: "1", unit: "1" },
        }
      }, {
        name:
          "session4",
        document: {
          uri: "/TDG/load/scenario-with-multiple-sessions+session4",
          timestamp: +new Date( "2015-02-04T00:00:00-0500" ) },
        instance:
          "/TDG/0123456789ABCDEF",
        state: {
          title: "Scenario with multiple sessions",
          classroom: { company: "Company", platoon: "1", unit: "1" },
        }
      } ]
    }

  ];

}
