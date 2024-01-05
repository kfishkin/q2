import React from 'react';
import 'antd/dist/reset.css';
import { VERSION } from './AboutPage';
import { Layout } from 'antd';
import Ingredients from './Ingredients';
import NavMenu from './NavMenu';
import Preps from './Preps';
import StepConfigs from './step_config';


class TopLevel extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentPage: 'none',
        }
    }
    handleShowPage(which) {
        console.log('show page', which);
        this.setState({ currentPage: which });
    }
    componentDidMount() {
        console.log('hello from didMount');
    };

    dumpIngredients() {
        let dumper = new Ingredients();
        let dump = dumper.Dump();
        let inner = [];
        dump.forEach((ingredient) => {
            inner.push(<li>{ingredient.name}</li>);
        });
        return <ul>{inner}</ul>;
    }
    dumpPreps() {
        let dumper = new Preps();
        let dump = dumper.Dump();
        let inner = [];
        dump.forEach((prep) => {
            inner.push(<li>{prep.name}</li>);
        });
        return <ul>{inner}</ul>;
    }
    dumpStepConfigs() {
        let dumper = new StepConfigs();
        let ingredsConfig = new Ingredients();
        let prepConfig = new Preps();
        let dump = dumper.Dump();
        let header = [];
        header.push(<thead><tr>
            <th>Id</th><th>ordinality</th><th>poss. ingrdients</th>
            <th>poss. preps</th><th># possibilities</th>
        </tr></thead>);
        let body = [];
        dump.forEach((config) => {
            let ingreds = [];
            config.possibleIngredients.forEach((ingredId) => {
                ingreds.push(ingredsConfig.byId(ingredId).name);
            });
            let preps = [];
            config.possiblePreps.forEach((prepId) => {
                preps.push(prepConfig.byId(prepId).name);
            });
            body.push(<tr><td>{config.stepConfigId}</td>
                <td>{config.ordinality}</td>
                <td>{ingreds.join()}</td>
                <td>{preps.join()}</td>
                <td>{dumper.NumPossibilities(config)}</td>
            </tr>);
        });
        return <table>{header}<tbody>{body}</tbody></table>;
    }

    renderContent() {
        var ans = "";
        switch (this.state.currentPage) {
            case 'none':
                ans = <span>no current page</span>;
                break;
            case 'dump ingredients':
                ans = this.dumpIngredients();
                break;
            case 'dump preps':
                ans = this.dumpPreps();
                break;
            case 'dump step configs':
                ans = this.dumpStepConfigs();
                break;
            default:
                ans = <div>unknown current page</div>;
                break;

        }
        return ans;
    }
    render() {
        const { Header, Footer, Sider, Content } = Layout;
        return (
            <Layout>
                <Header>
                    <div className="header_detail"><p>Header text</p></div>
                </Header>
                <Layout>
                    <Sider><div className="sider"><NavMenu
                        handleShowPage={(which) => this.handleShowPage(which)} /></div>
                    </Sider>
                    <Content>{this.renderContent()}</Content>
                </Layout>
                <Footer style={{ 'textAlign': 'left' }}><span>Q2 version {VERSION}</span></Footer>
            </Layout>
        );

    }
}

export default TopLevel;
