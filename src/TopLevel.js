import React from 'react';
import 'antd/dist/reset.css';
import { VERSION } from './AboutPage';
import { Layout } from 'antd';


class TopLevel extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentPage: 'none',
            greatHallLevels: {},
            lockedSlots: {}, // keys are gear types that are locked.
            eligibleRanks: {
                'one': true, 'two': true, 'three': true,
                'four': true, 'five': true, 'six': true
            },
            hasDoneSomething: true
            // setSpec map from set key to {None, Some, Set}. Default is 'Some'
            // fileName name of last loaded file.
        }
    }
    handleShowPage(which) {
        this.setState({ currentPage: which });
    }
    componentDidMount() {
        console.log('hello from didMount');
    };


    renderContent() {
	return <p>Content</p>
    }
    render() {
        const { Header, Footer, Sider, Content } = Layout;
        return (
            <Layout>
                <Header>
                    <div className="header_detail"><p>Header text</p></div>
		</Header>
                <Layout>
                    <Sider><div className="sider">Sider</div>
                    </Sider>
                    <Content>{this.renderContent()}</Content>
                </Layout>
                <Footer style={{ 'textAlign': 'left' }}><span>Q2 version {VERSION}</span></Footer>
            </Layout>
        );

    }
}

export default TopLevel;
