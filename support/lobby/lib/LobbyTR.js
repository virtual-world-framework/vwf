import React from "react";
import PropTypes from "prop-types";
import { ReactTableDefaults } from "react-table";
import _ from "lodash";

let BaseTR = ReactTableDefaults.TrComponent;

class LobbyTR extends React.Component {

  static propTypes = {
    fields:
      PropTypes.arrayOf( PropTypes.string ).isRequired,
    readers:
      PropTypes.objectOf( PropTypes.func ).isRequired,
    writers:
      PropTypes.objectOf( PropTypes.func ).isRequired,
  };

  static defaultProps = {
    fields: [],
    readers: {},
    writers: {},
  };

  state = {
    values:
      _.zipObject( this.props.fields, this.props.fields.map( field => "" ) )
  };

  static childContextTypes = {
    values:
      PropTypes.objectOf( PropTypes.string ).isRequired,
    readers:
      PropTypes.objectOf( PropTypes.func ).isRequired,
    writers:
      PropTypes.objectOf( PropTypes.func ).isRequired,
  };

  getChildContext() {
    return {
      values:
        this.state.values,
      readers:
        _.mapValues( this.props.readers, reader =>
          () => reader( this.state.values ) ),
      writers:
        _.mapValues( this.props.writers, writer =>
          ( ...args ) => {
            let values = writer( ...args );
            this.setState( prevState => ( { values: _.assign( prevState.values, values ) } ) )
          } ),
    };
  }

  render() {
    return <BaseTR { ..._.omit( this.props, _.keys( LobbyTR.defaultProps ) ) }/>;
  }

}

ReactTableDefaults.TrComponent = LobbyTR;
