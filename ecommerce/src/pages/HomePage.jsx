import axios from 'axios';
import { useEffect, useState } from 'react';
import Header from '../components/Header';
import Product from './Product';
import './HomePage.css';



function HomePage({ cart, loadCart }) {
    const [products, setProducts] = useState([]);

    useEffect(() => {
        const getHomeData = async () => {
            const response = await axios.get('/api/products')
            setProducts(response.data);
        };

        getHomeData();
    }, []);

    return (
        <>
            <title>E-commerce Project</title>

            <Header cart={cart} />

            <div className="home-page">
                <div className="products-grid" loadCart={loadCart}>
                    {products.map((product) => {


                        return (
                            <Product key={product.id} product={product} loadCart={loadCart} />
                        );
                    })}
                </div>
            </div>
        </>
    );
}

export default HomePage;