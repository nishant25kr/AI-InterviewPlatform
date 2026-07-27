import './App.css'
import {BrowserRouter, Route, Routes} from "react-router-dom"
import { Home } from './Pages/Home'
import { Login } from './Pages/Login'
import { Signup } from './Pages/SignUp'
import { Interview } from './Pages/Interview'
import { Result } from './Pages/Result'


function App() {
  return (
    <BrowserRouter>
		<Routes>
			<Route path='/' element={<Home/>} />
			<Route path='/login' element={<Login/>} />
			<Route path='/signup' element={<Signup/>} />
			<Route path='/home' element={<Home/>} />
			<Route path='/interview/:interviewId' element={<Interview/>} />
			<Route path='/result/:interviewId' element={<Result/>} />
		</Routes>
    </BrowserRouter>
  )
}

export default App
