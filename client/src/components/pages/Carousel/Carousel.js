import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/autoplay';

// Import Swiper core and required modules
import { Navigation, Pagination, Autoplay } from 'swiper/modules';

// Import required styles
import './Carousel.css';

const Carousel = ({imageUrls, onImageClick}) => {
    return (
<Swiper
    modules={[Navigation, Pagination, Autoplay]}
    spaceBetween={10}
    slidesPerView={4}
    centeredSlides={false}
    autoplay={{
        delay: 2500,
        disableOnInteraction: false,
    }}
    pagination={{
        clickable: true,
    }}
    navigation={true}
    className="mySwiper"
    breakpoints={{
        640: {
            slidesPerView: 1,
            spaceBetween: 10,
        },
        768: {
            slidesPerView: 2,
            spaceBetween: 20,
        },
        1024: {
            slidesPerView: 3,
            spaceBetween: 30,
        },
        1200: {
            slidesPerView: 4,
            spaceBetween: 40,
        },
    }}
>

        {imageUrls.map((url, index) => (
                        <SwiperSlide key={index}>
                            <img className="carousel-image" src={url} alt={`Slide ${index}`} onClick={() => onImageClick(index)} />
                        </SwiperSlide>
                    ))}
        </Swiper>
    );
};

export default Carousel;

