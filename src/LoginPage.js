import React from 'react';
import { Button, Form, Input } from 'antd';


// props:
// handleShowPage(x) call to set main page to x.
// beGateway - be gateway
// onLogin - func(id, handle, name) when logging in.
// oonLogout - func() when logging out
// playerInfo - current player info

class LoginPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      makingNewAccount: false,
      beGateway: this.props.beGateway,
      debugMessage: "",
      statusMessage: ""
    }
  }

  createUser() {
    this.setState({ makingNewAccount: true });

  }

  showNewAccountPage() {
    const onFinish = (values) => {
      console.log('Success:', values);
      this.setState({ statusMessage: "Creating..." });
      this.props.beGateway.createPlayer(values.handle, values.name, values.email, values.password)
        .then((v) => {
          console.log('back from create player, v=", v);');
          if (v && v.handle && v.name) {
            this.setState({ statusMessage: `player ${v.name} created!` });
            this.props.onLogin(v._id, v.handle, v.name);
          } else {
            this.setState({ statusMessage: `Sorry, failure creating the player` });
          }
        });
      }

      const onFinishFailed = (errorInfo) => {
        console.log('Failed:', errorInfo);
      };
      return (
        <div>
          <h1>Hello, new player...</h1>
          <div>{this.state.statusMessage}</div>
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
              label="Username"
              name="handle"
              rules={[
                {
                  required: true,
                  message: 'Please input your username',
                },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[
                {
                  required: true,
                  message: 'Please input your password',
                },
              ]}
            >
              <Input.Password />
            </Form.Item>
            <Form.Item
              label="Display name"
              name="name"
              rules={[
                {
                  required: true,
                  message: 'Please input your display name',
                },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="email"
              name="email"
              rules={[
                {
                  required: true,
                  message: 'Please input your email contact info',
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
        </div >
      )
    };

    showLogoutPage(playerInfo) {
      let onSubmit = (e) => {
        this.props.onLogout();
      }

      return (
        <div>
          <span>{playerInfo.displayName}</span>, are you sure you want to logout?
          <br />
          <button onClick={(e) => onSubmit(e)}>Yes, I'm sure</button>
        </div>
      )
    };


    render() {
      if (this.state.makingNewAccount) {
        return this.showNewAccountPage();
      }
      if (this.props.playerInfo && this.props.playerInfo.handle) {
        return this.showLogoutPage(this.props.playerInfo);
      }
      const onFinish = (values) => {
        console.log('Success:', values);
        const handle = values.username;
        const password = values.password;
        const component = this;
        this.state.beGateway.playerExists(handle, password)
          .then((v) => {
            console.log('onFinish, v=', JSON.stringify(v));
            // a failed login comes back as an empty object.
            if (!v.handle) {
              component.setState({
                debugMessage: `failed login for ${handle}`
              });
            } else {
              component.props.onLogin(v._id, v.handle, v.name);
            }
          })

          .catch((e) => {
            // happens on login fail
            component.setState({
              debugMessage: `failed login for ${handle}`
            });
          });
      };
      const onFinishFailed = (errorInfo) => {
        console.log('Failed:', errorInfo);
      };
      // from https://ant.design/components/form
      return (
        <div>
          <h1>Login page</h1>
          {this.state.debugMessage ? (<div>debugMessage = ${this.state.debugMessage}</div>) : ""}
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
              label="Username"
              name="username"
              rules={[
                {
                  required: true,
                  message: 'Please input your username',
                },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[
                {
                  required: true,
                  message: 'Please input your password',
                },
              ]}
            >
              <Input.Password />
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
          <div>
            Or <button onClick={(e) => this.createUser()}>Create a new user</button>
          </div>
        </div >
      );
    }
  }

export default LoginPage;