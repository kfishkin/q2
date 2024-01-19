import React from 'react';
import { Button, Form, Input } from 'antd';


// props:
// topState - state at the top level
// onNewStates - fn(dict of new states for top level)

class ConfigPage extends React.Component {

  render() {
    const onFinish = (values) => {
      console.log('Success:', values);
      if (values && values.mongoDbConnStr && values.mongoDbConnStr !== this.props.mongoDbConnStr) {
        console.log(`change mongoDbConnStr to ${values.mongoDbConnStr}`);
        this.props.onNewStates( {
          'mongoDbConnStr': values.mongoDbConnStr
        })
      }
    };
    const onFinishFailed = (errorInfo) => {
      console.log('Failed:', errorInfo);
    };
    // from https://ant.design/components/form
    return (
      <div>
        <h1>Config page</h1>
        <div>
          <span>process.env=</span><span>${JSON.stringify(process.env)}</span>
        </div>
        <Form
          name="basic"
          labelCol={{
            span: 8,
          }}
          wrapperCol={{
            span: 16,
          }}
          style={{
            maxWidth: 600,
          }}
          initialValues={{
            remember: true,
          }}
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          autoComplete="off"
        >
          <Form.Item
            label="MongoDB connection string"
            name="mongoDbConnStr"
            initialValue={this.props.topState.mongoDbConnStr}
            rules={[
              {
                required: false,
                message: 'Please input mongo',
              },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            wrapperCol={{
              offset: 8,
              span: 16,
            }}
          >
            <Button type="primary" htmlType="submit">
              Submit
            </Button>
          </Form.Item>
        </Form>
        <hr />
        </div>
    );
  }
}

export default ConfigPage;