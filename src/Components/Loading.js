import { Bars } from 'react-loading-icons'

export default function Loading(){



    return(
        <div className='loading-container' style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh'
        }}>
            <Bars fill="lightblue" />
        </div>
    )
}