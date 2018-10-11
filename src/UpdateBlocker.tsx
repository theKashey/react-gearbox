import * as React from 'react';

interface BlockerProps {
  value: any;
  children?: any;
  render?: (value: any) => React.ReactNode;
}

interface SuppressProps {
  bits: number;
  children: React.ReactNode;

  updateBits(bits: number): void;
}

export class UpdateBlocker extends React.Component<BlockerProps> {
  shouldComponentUpdate(props: BlockerProps) {
    return this.props.value !== props.value
  }

  render() {
    const {value, children, render} = this.props;
    return children ? children : render(value);
  }
}

export class SuppressUpdate extends React.Component<SuppressProps> {
  shouldComponentUpdate(props: SuppressProps) {
    return (this.props.bits !== props.bits || this.props.children !== props.children);
  }

  componentDidMount() {
    this.props.updateBits(this.props.bits);
  }

  componentDidUpdate(props: SuppressProps) {
    if (this.props.bits !== props.bits) {
      this.props.updateBits(this.props.bits);
    }
  }

  render() {
    return this.props.children;
  }
}
