import React from 'react';
import { Button, Form, Input } from 'antd';



// props:
// beGateway - existing be gateway

class ConfigPage extends React.Component {
  //navigate = useNavigate();

  render() {
    
    const onFinish = (values) => {
      if (values && values.beURI) {

        console.log(`change beURI to ${values.beURI}`);
        this.props.beGateway.setURI(values.beURI);
        //return redirect("./fooble");


      }
    };
    const onFinishFailed = (errorInfo) => {
      console.error('Failed:', errorInfo);
    };
    // from https://ant.design/components/form
    return (
      <div>
        <h1>Config page</h1>
        <div>
          <span>process.env=</span><span>{JSON.stringify(process.env)}</span>
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
            label="backend URI"
            name="beURI"
            initialValue={this.props.beGateway.getURI()}
            rules={[
              {
                required: false,
                message: 'Please input be URI',
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