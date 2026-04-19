import React, { useEffect, useState } from 'react'
import { Container, Form, Button, Message, Header, Icon, Segment } from 'semantic-ui-react'
import { useAuth } from '../context/AuthContext'
import { orderApi } from '../misc/OrderApi'
import { handleLogError } from '../misc/Helpers'

function ProfilePage() {
  const Auth = useAuth()
  const user = Auth.getUser()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      try {
        const response = await orderApi.getUserMe(user)
        setName(response.data.name || '')
        setEmail(response.data.email || '')
      } catch (error) {
        handleLogError(error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSuccessMessage('')
    setErrorMessage('')

    if (!name.trim() || !email.trim()) {
      setErrorMessage('Name and email are required')
      return
    }

    try {
      setIsLoading(true)
      const payload = { name: name.trim(), email: email.trim() }
      if (password.trim()) payload.password = password.trim()
      await orderApi.updateUserMe(user, payload)
      setSuccessMessage('Profile updated successfully')
      setPassword('')
    } catch (error) {
      handleLogError(error)
      const msg = error.response && error.response.data && error.response.data.message
        ? error.response.data.message
        : 'Failed to update profile'
      setErrorMessage(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Container>
      <Segment basic>
        <Header as='h2'>
          <Icon name='user circle' />
          <Header.Content>My Profile</Header.Content>
        </Header>
        <Form onSubmit={handleSubmit} loading={isLoading} success={!!successMessage} error={!!errorMessage}>
          <Form.Input
            fluid
            label='Name'
            placeholder='Name'
            value={name}
            onChange={(e, { value }) => setName(value)}
          />
          <Form.Input
            fluid
            label='Email'
            placeholder='Email'
            type='email'
            value={email}
            onChange={(e, { value }) => setEmail(value)}
          />
          <Form.Input
            fluid
            label='New password (leave blank to keep current)'
            placeholder='New password'
            type='password'
            value={password}
            onChange={(e, { value }) => setPassword(value)}
          />
          <Message success header='Updated' content={successMessage} />
          <Message error header='Error' content={errorMessage} />
          <Button primary type='submit'>Save changes</Button>
        </Form>
      </Segment>
    </Container>
  )
}

export default ProfilePage
