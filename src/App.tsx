import './App.scss'
import { Signer, getDefaultProvider } from 'ethers'
import { Web3Provider, Provider } from 'ethers/providers'
import React, { Component, ReactNode, ChangeEvent } from 'react'
import TokenList from './TokenList'
import { Button, Form, Container, Row, Col } from 'react-bootstrap'
import { shortenAddress } from './util'
import { getAddress } from 'ethers/utils'

declare let window: any
declare let web3: any

type AppState = {
  provider?: Provider,
  signer?: Signer,
  signerAddress?: string,
  signerEnsName?: string,
  inputAddressOrName?: string,
  inputAddress?: string,
}

class App extends Component<{}, AppState> {
  state: AppState = {}

  async componentDidMount() {
    // Set default provider for READ operations
    const provider = getDefaultProvider();
    this.setState({ provider })

    // Connect with Web3 provider for WRITE operations if access is already granted
    if (window.ethereum || window.web3) {
      try {
        // Check if access is granted
        await this.connectSigner()
      } catch (e) {} // ignored
    }
  }

  async connectWeb3() {
    if (window.ethereum) {
      try {
        // Request account access if needed
        await window.ethereum.enable();
      } catch (error) {
        // User denied account access...
        return
      }
    }
    await this.connectSigner()
  }

  async connectSigner() {
    // Retrieve signer from web3 object
    const signer = new Web3Provider(web3.currentProvider).getSigner()

    // Retrieve signer address and ENS name
    const signerAddress = await signer.getAddress()
    const signerEnsName = await this.state.provider.lookupAddress(signerAddress)

    // Prepopulate the input address or ENS name
    const inputAddressOrName = signerEnsName || signerAddress
    const inputAddress = await this.parseInputAddress(inputAddressOrName)

    this.setState({ signer, signerAddress, signerEnsName, inputAddressOrName, inputAddress })
  }

  async handleInputAddressChanged(event: ChangeEvent<HTMLInputElement>) {
    // Update input value
    const inputAddressOrName = event.target.value
    this.setState({ inputAddressOrName })

    // Update input address if it is valid
    const inputAddress = await this.parseInputAddress(inputAddressOrName)
    if (inputAddress) {
      this.setState({ inputAddress })
    }
  }

  async parseInputAddress(inputAddressOrName: string): Promise<string | undefined> {
    // If the input is an ENS name, resolve it
    if (inputAddressOrName.endsWith('.eth')) {
      const address = await this.state.provider.resolveName(inputAddressOrName)
      return address ? address : undefined
    }

    // If the input is an address, validate it and return it
    try {
      return getAddress(inputAddressOrName)
    } catch (e) {
      return undefined
    }
  }

  getTextForConnectButton(): string {
    return this.state.signerAddress
      ? this.state.signerEnsName || shortenAddress(this.state.signerAddress)
      : 'Connect web3'
  }

  render(): ReactNode {
    return (
      <Container fluid className="App">
        {this.renderHeader()}
        {this.renderAddressInput()}
        {this.renderTokenList()}
        {this.renderFooter()}
      </Container>
    )
  }

  renderHeader() {
    return (
      <Row className="Header">
        <Col></Col>
        <Col className="my-auto"><img className="logo" src="revoke.svg" alt="revoke.cash logo"/></Col>
        <Col className="my-auto">
          <Button style={{ float: 'right' }} variant="outline-primary" onClick={() => this.connectWeb3()}>
            {this.getTextForConnectButton()}
          </Button>
        </Col>
      </Row>
    )
  }

  renderAddressInput() {
    return (
      <Row>
        <Col></Col>
        <Col className="my-auto" lg="6" md="12" sm="12">
          <Form.Group>
            <Form.Control
              className="AddressInput text-center"
              placeholder="Enter Ethereum address or ENS name"
              value={this.state.inputAddressOrName || ''}
              onChange={(event: ChangeEvent<HTMLInputElement>) => this.handleInputAddressChanged(event)}
              onDoubleClick={() => { return }} // Re-enable double-click to select
            ></Form.Control>
          </Form.Group>
        </Col>
        <Col></Col>
      </Row>
    )
  }

  renderTokenList() {
    if (!this.state.inputAddress) return

    return (<TokenList
      provider={this.state.provider}
      signer={this.state.signer}
      signerAddress={this.state.signerAddress}
      inputAddress={this.state.inputAddress}
    />)
  }

  renderFooter() {
    return (<p>
      Site created by <a href="https://kalis.me/">Rosco Kalis</a> (<a href="https://github.com/rkalis/revoke.cash">Source</a>)
    </p>)
  }
}

export default App
