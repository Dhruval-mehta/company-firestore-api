function calculateTotalLoanAmount() {
   // Select all loan amount data
   const loanAmountElements = document.querySelectorAll('.loans-table .amount-value');
   // Calculate total loan amount
   const totalLoanAmount = Array.from(loanAmountElements)
      .reduce((total, element) => {
         // Get the data-amount attribute and convert to number
         const amount = parseFloat(element.getAttribute('data-amount') || '0');
         return total + amount;
      }, 0);
   // Count number of loan providers
   const loanProviderCount = document.querySelectorAll('.loans-table tbody tr').length;
   // Update the financial metric element
   const totalLoansMetricValue = document.querySelector('.financial-metric:nth-child(2) .metric-value');
   const totalLoansMetricPeriod = document.querySelector('.financial-metric:nth-child(2) .metric-period');
   if (totalLoansMetricValue) {
      // Use formatIndianCurrency to format the total loan amount
      totalLoansMetricValue.textContent = '₹ ' + formatIndianCurrency(totalLoanAmount);
   }
   if (totalLoansMetricPeriod) {
      totalLoansMetricPeriod.textContent = `From ${loanProviderCount} financial institutions`;
   }
   return { totalLoanAmount, loanProviderCount };
}

function formatIndianCurrency(num) {
   if (!num) return "0";
   let numStr = num.toString();

   let decimal = '';
   if (numStr.includes('.')) {
      const parts = numStr.split('.');
      numStr = parts[0];
      decimal = '.' + parts[1];
   }

   let formattedNum = '';
   let count = 0;
   for (let i = numStr.length - 1; i >= 0; i--) {
      formattedNum = numStr[i] + formattedNum;
      count++;
      if (count === 3 && i !== 0) {
         formattedNum = ',' + formattedNum;
      } else if (count > 3 && (count - 3) % 2 === 0 && i !== 0) {
         formattedNum = ',' + formattedNum;
      }
   }
   return formattedNum + decimal;
}

function initializeRevenueTrendChart() {
   const ctx = document.getElementById('revenueTrendChart');
   if (!ctx) return console.error("'revenueTrendChart' element not found");

   const dataTag = document.getElementById("financial-data");
   if (!dataTag) return console.error("Financial data script tag not found");

   const financialData = JSON.parse(dataTag.textContent || "[]");

   const slabLabels = [
      '₹0 to ₹40L',
      '₹40L to ₹1.5Cr',
      '₹1.5Cr to ₹5Cr',
      '₹5Cr to ₹20Cr',
      '₹20Cr to ₹50Cr',
      '₹50Cr to ₹100Cr',
      '₹100Cr to ₹500Cr',
      '₹500Cr and above'
   ];

   const slabIndices = financialData.map(item => item.slabIndex);
   const years = financialData.map(item => item.year);
   const revenues = financialData.map(item => item.revenue);


   new Chart(ctx.getContext('2d'), {
      type: 'line',
      data: {
         labels: years,
         datasets: [{
            label: 'Annual Revenue (₹ Cr)',
            data: slabIndices,
            fill: false,
            borderColor: '#8b5cf6',
            tension: 0.3,
            borderWidth: 2,
            pointRadius: 4,
            pointBackgroundColor: '#8b5cf6',
            pointBorderColor: '#fff',
            pointBorderWidth: 1,
            pointHoverRadius: 6
         }]
      },
      options: {
         responsive: true,
         maintainAspectRatio: true,
         aspectRatio: 2,
         plugins: {
            title: {
               display: true,
               text: 'Annual Revenue Growth by Financial Year',
               font: {
                  size: 18
               },
               padding: {
                  top: 10,
                  bottom: 30
               }
            },
            legend: {
               display: true,
               position: 'top'
            },
            tooltip: {
               callbacks: {
                  label: function (ctx) {
                     const index = ctx.dataIndex;
                     const slab = slabLabels[slabIndices[index]] || 'N/A';
                     const rev = revenues[index];
                     return `Revenue: ₹${rev} Cr (${slab})`;
                  }
               }
            }
         },
         layout: {
            padding: {
               top: 20,
               bottom: 20,
               left: 10,
               right: 10
            }
         },
         scales: {
            x: {
               title: {
                  display: true,
                  text: 'Financial Year',
                  font: {
                     size: 14
                  }
               },
               ticks: {
                  font: {
                     size: 12
                  }
               },
               grid: {
                  display: false
               }
            },
            y: {
               beginAtZero: true,
               title: {
                  display: true,
                  text: 'Revenue Slab',
                  font: {
                     size: 14
                  }
               },
               ticks: {
                  callback: function (value) {
                     return slabLabels[value] || '';
                  },
                  font: {
                     size: 12
                  },
                  padding: 10,
                  stepSize: 1
               },
               grid: {
                  color: '#eee'
               },
               min: 0,
               max: slabLabels.length - 1
            }
         }
      }
   });
}

function formatDateLabel(wageYearMonth) {
   const year = wageYearMonth.substring(0, 4);
   const month = wageYearMonth.substring(4, 6);
   const date = new Date(`${year}-${month}-01`);
   return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
}

function renderEmployeeChart() {
   const rawData = document.getElementById('employee-data').textContent;
   const employeeData = JSON.parse(rawData);

   const labels = employeeData.map(item => formatDateLabel(item.wageYearMonth_));
   const employee_count = employeeData.map(item => item.employeeCount);

   const ctx = document.getElementById('employee-graph').getContext('2d');

   new Chart(ctx, {
      type: 'line',
      data: {
         labels: labels,
         datasets: [{
            label: 'Employee Count',
            data: employee_count,
            fill: false,
            borderColor: '#6366f1',
            backgroundColor: '#6366f1',
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 6,
            borderWidth: 2
         }]
      },
      options: {
         responsive: true,
         maintainAspectRatio: true,
         aspectRatio: 2,
         plugins: {
            legend: {
               display: true,
               position: 'top'
            },
            title: {
               display: false
            }
         },
         scales: {
            x: {
               title: {
                  display: true,
                  text: 'Month'
               },
               ticks: {
                  maxRotation: 45,
                  minRotation: 45
               }
            },
            y: {
               title: {
                  display: true,
                  text: 'Employee Count'
               },
               beginAtZero: true,
               stepSize: 1
            }
         }
      }
   });
}

function initializeLoansChart() {
   const rawData = document.getElementById('loan-data').textContent;
   const loanData = JSON.parse(rawData);

   const ctx = document.getElementById('loan-chart').getContext('2d');
   new Chart(ctx, {
      type: 'line',
      data: {
         labels: loanData.labels,
         datasets: [{
            label: 'Active  Loan Amount (₹)',
            data: loanData.data,
            borderColor: '#0f766e',
            backgroundColor: '#5eead4',
            tension: 0.3,
            fill: false,
            pointRadius: 4,
            borderWidth: 2
         }]
      },
      options: {
         responsive: true,
         plugins: {
            tooltip: {
               callbacks: {
                  label: (ctx) => `₹${ctx.parsed.y.toLocaleString()}`
               }
            }
         },
         scales: {
            x: {
               title: { display: true, text: 'Quarter' }
            },
            y: {
               beginAtZero: true,
               title: { display: true, text: 'Amount (₹)' },
               ticks: {
                  callback: (value) => `₹${(value / 10000000).toFixed(1)} Cr`
               }
            }
         }
      }
   });
}

function checkSectionContent() {
   document.querySelectorAll('.section').forEach(section => {
      if (section.querySelector('.header')) return;

      const sectionBody = section.querySelector('.section-body');
      if (!sectionBody) return;
      const hasContent = Array.from(sectionBody.children).some(child => {
         if (child.nodeType === 3 || child.nodeType === 8) return false;
         return child.textContent.trim() !== '';
      });

      if (!hasContent) {
         section.classList.add('empty-section');
      }
   });
}

function colorizeAlerts() {
   document.querySelectorAll('.alert-card').forEach(card => {
      const severitySpan = card.querySelector('.alert-severity');
      if (severitySpan) {
         const severity = severitySpan.textContent.replace(/[\[\]]/g, '').toLowerCase();
         // Add severity class to card
         card.classList.add(`severity-${severity}`);
         card.setAttribute('data-severity', severity);
         // Also style the severity span
         severitySpan.setAttribute('data-severity', severity);
      }
   });
}

document.addEventListener('DOMContentLoaded', function () {
   document.querySelectorAll('.loan-amount, .amount-value').forEach(element => {
      const amount = element.getAttribute('data-amount');
      if (amount) {
         element.textContent = '₹ ' + formatIndianCurrency(amount);
      }
   });

   checkSectionContent();
   calculateTotalLoanAmount();
   colorizeAlerts();
   initializeRevenueTrendChart();
   initializeLoansChart();
   renderEmployeeChart();

   // Setup progress bars for breakdown items
   document.querySelectorAll('.breakdown-item').forEach(item => {
      const valueElement = item.querySelector('.breakdown-item-value');
      if (valueElement) {
         const percentage = parseFloat(valueElement.textContent);
         if (!isNaN(percentage)) {
            // Create progress bar
            const progressBar = document.createElement('div');
            progressBar.className = 'breakdown-progress';

            const progressFill = document.createElement('div');
            progressFill.className = 'progress-fill';
            progressFill.style.width = `${percentage}%`;

            progressBar.appendChild(progressFill);

            // Insert after labels
            const labels = item.querySelector('.breakdown-labels');
            if (labels) {
               labels.after(progressBar);
            }
         }
      }
   });
});