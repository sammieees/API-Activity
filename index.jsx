import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_URL = 'https://dummyjson.com/products';

// Remove "meta" from the API data before displaying it.
function removeMeta(data) {
    if (Array.isArray(data)) {
    return data.map(removeMeta);
}

    if (data !== null && typeof data === 'object') {
    const cleanData = {};

    for (const key in data) {
        if (key !== 'meta') {
        cleanData[key] = removeMeta(data[key]);
    }
}

    return cleanData;
}

    return data;
}

export default function App() {
  // Data shown in the app
    const [products, setProducts] = useState([]);
    const [locallyAddedIds, setLocallyAddedIds] = useState([]);
    const [latestResponse, setLatestResponse] = useState(null);

  // Values entered in the form
    const [title, setTitle] = useState('New demo product');
    const [productId, setProductId] = useState('1');

  // Loading and error messages
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

  // GET: retrieve products from the API
    async function getProducts() {
    setLoading(true);
    setError('');
    setNotice('');

    try {
        const response = await fetch(`${API_URL}?limit=10`);
        const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Could not load products.');
}

        const cleanData = removeMeta(data);
        setProducts(cleanData.products);
        setLocallyAddedIds([]);
        setLatestResponse(cleanData);
    } catch (error) {
        setError(error.message);
    } finally {
        setLoading(false);
    }
}

  // Load products automatically when the app opens
    useEffect(() => {
    getProducts();
    }, []);

  // POST: send a new product to the API
async function addProduct() {
    setLoading(true);
    setError('');
    setNotice('');

    try {
    const response = await fetch(`${API_URL}/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
        title: title.trim() || 'Untitled product',
        price: 9.99,
        }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Could not add the product.');
    }

    const cleanData = removeMeta(data);
    setProducts((currentProducts) => [cleanData, ...currentProducts]);
    setLocallyAddedIds((currentIds) => [...currentIds, cleanData.id]);
      // The API creates the ID, so put that returned ID into the form.
    setProductId(String(cleanData.id));
    setLatestResponse(cleanData);
    } catch (error) {
    setError(error.message);
    } finally {
    setLoading(false);
    }
}

  // PATCH: change only the title of the selected product
async function updateProduct() {
    const id = Number(productId);

    if (!Number.isInteger(id) || id < 1) {
    setError('Enter a valid product ID.');
    return;
    }

    setLoading(true);
    setError('');
    setNotice('');

    try {
        const response = await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            title: title.trim() || 'Updated product',
        }),
    });

        const data = await response.json();

        if (!response.ok) {
        throw new Error(data.message || 'Could not update the product.');
    }

        const cleanData = removeMeta(data);
        setProducts((currentProducts) =>
        currentProducts.map((product) =>
            product.id === id ? { ...product, ...cleanData } : product
        )
        );
        setLatestResponse(cleanData);
    } catch (error) {
        setError(error.message);
    } finally {
        setLoading(false);
    }
}

  // DELETE: remove a product by its ID
async function deleteProduct() {
    const id = Number(productId);

    if (!Number.isInteger(id) || id < 1) {
        setError('Enter a valid product ID.');
        return;
    }

    setLoading(true);
    setError('');
    setNotice('');

    try {
        const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        });

    const data = await response.json();
    const cleanData = removeMeta(data);
    const wasAddedLocally = locallyAddedIds.includes(id);

      // DummyJSON does not really save products created with POST.
      // If that simulated ID is not found, still remove it from this app's list.
        if (!response.ok && !wasAddedLocally) {
        throw new Error(data.message || 'Could not delete the product.');
        }

    setProducts((currentProducts) =>
        currentProducts.filter((product) => product.id !== id)
    );
        setLocallyAddedIds((currentIds) => currentIds.filter((savedId) => savedId !== id));
    setLatestResponse(cleanData);

        if (wasAddedLocally && !response.ok) {
        setNotice(
            'DummyJSON did not save this POST product, so its DELETE request returned not found. It was removed from this app only.'
        );
        } else {
        setNotice('The product was removed from this app. DummyJSON does not permanently save DELETE changes.');
    }
    } catch (error) {
        setError(error.message);
    } finally {
        setLoading(false);
    }
}

return (
    <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>API-Activity</Text>

        <View style={styles.panel}>
            <Text style={styles.label}>Product title</Text>
            <TextInput
            value={title}
            onChangeText={setTitle}
            style={styles.input}
            placeholder="Enter a product title"
        />

        <Text style={styles.label}>Product ID</Text>
        <TextInput
            value={productId}
            onChangeText={setProductId}
            style={styles.input}
            keyboardType="number-pad"
            placeholder="1"
        />

        <View style={styles.buttonRow}>
            <ActionButton title="GET products" onPress={getProducts} />
            <ActionButton title="POST add" onPress={addProduct} />
            <ActionButton title="PATCH update" onPress={updateProduct} />
            <ActionButton title="DELETE product" onPress={deleteProduct} />
        </View>

        {loading && (
            <View style={styles.status}>
                <ActivityIndicator />
                <Text style={styles.statusText}>Loading...</Text>
            </View>
            )}

        {!!error && <Text style={styles.error}>Error: {error}</Text>}
        {!!notice && <Text style={styles.notice}>{notice}</Text>}
        </View>

        <Text style={styles.sectionTitle}>Products ({products.length})</Text>

        {products.map((product) => (
            <View key={String(product.id)} style={styles.card}>
            {product.thumbnail ? (
                <Image
                source={{ uri: product.thumbnail }}
                style={styles.productImage}
                resizeMode="cover"
                />
            ) : null}
            <Text style={styles.cardTitle}>{product.title}</Text>
            <Text style={styles.json}>
                {JSON.stringify(removeMeta(product), null, 2)}
            </Text>
            </View>
        ))}

        <Text style={styles.sectionTitle}>Latest API response</Text>
        <View style={styles.responseBox}>
            <Text selectable style={styles.json}>
            {latestResponse
                ? JSON.stringify(removeMeta(latestResponse), null, 2)
                : 'The API response will appear here.'}
            </Text>
        </View>
        </ScrollView>
    </SafeAreaView>
);
}

// Reusable button used for all four requests
function ActionButton({ title, onPress }) {
    return (
    <Pressable style={styles.button} onPress={onPress}>
        <Text style={styles.buttonText}>{title}</Text>
    </Pressable>
);
}

// Screen styles
const styles = StyleSheet.create({
    safe: {
    flex: 1,
    backgroundColor: '#f4f6f8',
    },
    container: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    padding: 16,
    paddingBottom: 40,
},
    heading: {
    color: '#172b4d',
    fontSize: 23,
    fontWeight: '700',
    marginBottom: 8,
},
    note: {
    color: '#526174',
    lineHeight: 20,
    marginBottom: 16,
},
    panel: {
    backgroundColor: '#fff',
    borderColor: '#dce2e8',
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
},
    sectionTitle: {
    color: '#172b4d',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 10,
},
    label: {
    color: '#344563',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 5,
},
    input: {
    backgroundColor: '#fff',
    borderColor: '#b8c2cc',
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    fontSize: 16,
},
    buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
},
    button: {
    backgroundColor: '#1769aa',
    borderRadius: 7,
    paddingVertical: 11,
    paddingHorizontal: 13,
    marginRight: 8,
    marginTop: 6,
},
    buttonText: {
    color: '#fff',
    fontWeight: '700',
},
    status: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
},
    statusText: {
    color: '#526174',
    marginLeft: 8,
},
    error: {
    color: '#b42318',
    backgroundColor: '#fff1f0',
    padding: 10,
    marginTop: 12,
    borderRadius: 6,
},
    notice: {
    color: '#245b36',
    backgroundColor: '#eaf6ed',
    padding: 10,
    marginTop: 12,
    borderRadius: 6,
    lineHeight: 19,
},
    card: {
    backgroundColor: '#fff',
    borderColor: '#dce2e8',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 9,
},
    cardTitle: {
    color: '#172b4d',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
},
    productImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#e8edf2',
},
    responseBox: {
    backgroundColor: '#fff',
    borderColor: '#dce2e8',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
},
    json: {
    color: '#263238',
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 17,
},
});
