import { Canister, nat32, nat64, query, text } from 'azle';

export default Canister({
    test: query([], text, () => {
        const express = require('express');
        return 'yes';
    })
});
