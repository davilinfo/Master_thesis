import React, {useState} from 'react';

function FormOrder({onSubmit}){

    const [username, setUsername] = useState('');
    const [passphrase, setPassphrase] = useState('');
    const [phone, setPhone] = useState('');
    const [deliveryaddress, setDeliveryAddress] = useState('');    

    async function handleSubmit(e){
        e.preventDefault();        

        await onSubmit({
            username,
            phone,
            deliveryaddress,
            passphrase            
        });              
    }

    return (        
        <div className="address-form">                
            <form onSubmit={handleSubmit}>                    
                <div>
                    <label>Your Name</label>
                </div>
                <div>
                    <input type="text" className="input" id="username" name="username" required onChange={e=> setUsername(e.target.value)}/>
                </div>
                <div>
                    <label>Your phone</label>
                </div>
                <div>
                    <input type="text" className="input" id="phone" name="phone" required onChange={e=> setPhone(e.target.value)}/>
                </div>
                <div>
                    <label>Delivery address</label>
                </div>
                <div>
                    <textarea className="textarea" id="deliveryaddress" name="deliveryaddress" required onChange={e=> setDeliveryAddress(e.target.value)}/>
                </div>
                <div>
                    <label>Your Lisk Passphrase</label>
                </div>
                <div>
                    <input type="password" className="passphrase" id="passphrase" name="passphrase" required onChange={e=> setPassphrase(e.target.value)}/>
                </div>
                <div>
                    <label><span className="span-passphrase">copy this passphrase:</span> safe secret dentist color file ball town joy dad tilt foot asthma</label>
                </div>
                <div>
                    <button type="submit">Order</button>
                </div>
            </form>
        </div>        
    );
}

export default FormOrder;