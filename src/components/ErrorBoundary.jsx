import { Component } from 'react';
import PropTypes from 'prop-types';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 text-center">
          <h2 className="text-2xl font-bold text-red-600">Something went wrong.</h2>
          <p className="text-gray-500 mt-2">Please refresh the page.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired
};