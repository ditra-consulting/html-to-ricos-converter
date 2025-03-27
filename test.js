const fs = require('fs');
const { htmlToRicos } = require('./converter');

// Test HTML content
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Test HTML</title>
  <style>
    .red { color: red; }
    .center { text-align: center; }
  </style>
</head>
<body>
  <h1>Main Heading</h1>
  <p>This is a paragraph with <strong>bold</strong> and <em>italic</em> text.</p>
  
  <h2>Section 1</h2>
  <p>Here's a paragraph in section 1.</p>
  <ul>
    <li>Item 1</li>
    <li>Item 2</li>
    <li>Item 3</li>
  </ul>
  
  <h2>Section 2</h2>
  <p>Here's a paragraph in section 2 with a <a href="https://example.com">link</a>.</p>
  <blockquote>This is a blockquote.</blockquote>
  
  <h3>Subsection</h3>
  <p>This is a subsection with a table:</p>
  
  <table border="1">
    <thead>
      <tr>
        <th>Header 1</th>
        <th>Header 2</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Cell 1,1</td>
        <td>Cell 1,2</td>
      </tr>
      <tr>
        <td>Cell 2,1</td>
        <td>Cell 2,2</td>
      </tr>
    </tbody>
  </table>
  
  <div class="section">
    <h2>Final Section</h2>
    <p>This is the final section with some <span class="red">colored</span> text.</p>
    <p class="center">This paragraph is center-aligned.</p>
  </div>
</body>
</html>
`;

console.log('Testing HTML to Ricos conversion...');
const ricosContent = htmlToRicos(htmlContent);

// Save results to a file
fs.writeFileSync('test-output.json', JSON.stringify(ricosContent, null, 2));

console.log('Conversion complete! Results saved to test-output.json');
console.log(`Generated ${ricosContent.nodes.length} nodes`);

// Display summary of node types
const nodeTypes = {};
ricosContent.nodes.forEach(node => {
  nodeTypes[node.type] = (nodeTypes[node.type] || 0) + 1;
});

console.log('\nNode types summary:');
Object.entries(nodeTypes).forEach(([type, count]) => {
  console.log(`- ${type}: ${count}`);
}); 