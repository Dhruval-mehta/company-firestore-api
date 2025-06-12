// // Handlebars Helpers for Indian Currency Formatting
// if (typeof Handlebars !== 'undefined') {
//     // Indian currency formatting helpers
//     Handlebars.registerHelper('formatIndianAmount', function(amount) {
//         if (!amount && amount !== 0) return '₹0';
        
//         amount = parseFloat(amount);
        
//         if (amount >= 10000000) {
//             return '₹' + (amount / 10000000).toFixed(2) + " Cr"; // Crore
//         } else if (amount >= 100000) {
//             return '₹' + (amount / 100000).toFixed(2) + " Lakh"; // Lakh
//         } else if (amount >= 1000) {
//             return '₹' + (amount / 1000).toFixed(2) + " K"; // Thousand
//         } else {
//             return '₹' + amount.toString();
//         }
//     });
    
//     Handlebars.registerHelper('formatIndianShort', function(amount) {
//         if (!amount && amount !== 0) return '₹0';
        
//         amount = parseFloat(amount);
        
//         if (amount >= 10000000) {
//             return '₹' + (amount / 10000000).toFixed(0).replace(/\B(?=(\d{2})+(?!\d))/g, ",") + " Cr";
//         } else if (amount >= 100000) {
//             return '₹' + (amount / 100000).toFixed(0).replace(/\B(?=(\d{2})+(?!\d))/g, ",") + " Lakh";
//         } else if (amount >= 1000) {
//             return '₹' + (amount / 1000).toFixed(0) + " Thousand";
//         } else {
//             return '₹' + amount;
//         }
//     });
    
//     // Additional custom helpers
//     Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
//         return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
//     });
    
//     Handlebars.registerHelper('ifNotEquals', function(arg1, arg2, options) {
//         return (arg1 != arg2) ? options.fn(this) : options.inverse(this);
//     });
    
//     Handlebars.registerHelper('formatDate', function(date) {
//         if (!date) return '';
//         const d = new Date(date);
//         return d.toLocaleDateString('en-IN');
//     });
    
//     // Helper for showing stars in ratings
//     Handlebars.registerHelper('times', function(n, block) {
//         var accum = '';
//         for(var i = 0; i < n; ++i)
//             accum += block.fn(i);
//         return accum;
//     });
    
//     console.log('Handlebars helpers registered successfully');
// } else {
//     console.error('Handlebars not found! Helpers not registered.');
// }